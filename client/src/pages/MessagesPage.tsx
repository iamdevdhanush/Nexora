import { useEffect, useState } from 'react';
import { Send, RefreshCw, CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { cn, formatDateTime } from '@/lib/utils';

interface MsgLog {
  id: string; content: string; channel: string; status: string; sentAt: string;
  sentBy: { name: string };
  recipients: { id: string; status: string; team: { name: string }; error?: string }[];
}

const CHANNEL_STYLE: Record<string, string> = {
  WHATSAPP: 'text-[var(--success)] bg-[var(--success-bg)]',
  SMS: 'text-[var(--blue)] bg-[var(--blue-bg)]',
  INTERNAL: 'text-[var(--text-muted)] bg-[var(--bg-muted)]',
};

const STATUS_DOT: Record<string, string> = {
  SENT: 'bg-[var(--success)]', FAILED: 'bg-[var(--danger)]',
  QUEUED: 'bg-[var(--warning)]', PENDING: 'bg-[var(--border-strong)]',
};

export function MessagesPage() {
  const { activeHackathon } = useHackathonStore();
  const { setBroadcastOpen, toast } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [messages, setMessages] = useState<MsgLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = async () => {
    if (!activeHackathon) return;
    setLoading(true);
    try { setMessages(await api.get<MsgLog[]>(`/hackathons/${activeHackathon.id}/messages`)); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('message:status', load);
    return () => { socket.off('message:status', load); };
  }, [activeHackathon?.id]);

  const retry = async (id: string) => {
    if (!activeHackathon) return;
    setRetrying(id);
    try {
      await api.post(`/hackathons/${activeHackathon.id}/messages/${id}/retry`);
      toast('Retrying failed recipients…', 'info');
      setTimeout(load, 2000);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setRetrying(null); }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading">Messages</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-icon btn-sm" onClick={load}><RefreshCw className="w-3.5 h-3.5" /></button>
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setBroadcastOpen(true)}><Send className="w-3.5 h-3.5" />Broadcast</button>}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="card p-4"><div className="skeleton h-4 w-2/3 rounded mb-2" /><div className="skeleton h-3 w-1/3 rounded" /></div>)}</div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Send className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></div>
          <p className="font-medium" style={{ fontSize: 14 }}>No messages yet</p>
          <p className="text-caption mt-1">Broadcast to teams to get started</p>
          {isAdmin && <button className="btn btn-primary btn-sm mt-4" onClick={() => setBroadcastOpen(true)}><Send className="w-3.5 h-3.5" /> Send broadcast</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const sent = msg.recipients.filter((r) => r.status === 'SENT').length;
            const failed = msg.recipients.filter((r) => r.status === 'FAILED').length;
            const isExp = expanded === msg.id;
            return (
              <div key={msg.id} className="card overflow-hidden">
                <button onClick={() => setExpanded(isExp ? null : msg.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors duration-100"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <div className={cn('dot flex-shrink-0', STATUS_DOT[msg.status] || 'bg-[var(--border-strong)]')} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ fontSize: 14 }}>{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('badge text-[10px]', CHANNEL_STYLE[msg.channel] || CHANNEL_STYLE.INTERNAL)}>{msg.channel}</span>
                      <span className="text-caption">{formatDateTime(msg.sentAt)} · {msg.sentBy.name}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold" style={{ fontSize: 12, color: 'var(--success)' }}>{sent} sent</p>
                    {failed > 0 && <p className="font-semibold" style={{ fontSize: 12, color: 'var(--danger)' }}>{failed} failed</p>}
                    <ChevronDown className="w-3.5 h-3.5 mx-auto mt-0.5 transition-transform duration-200" style={{ color: 'var(--text-muted)', transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </div>
                </button>
                {isExp && (
                  <div className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
                    <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {msg.recipients.slice(0, 20).map((r) => (
                        <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                          {r.status === 'SENT' ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                            : r.status === 'FAILED' ? <XCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--danger)' }} />
                            : <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--warning)' }} />}
                          <span className="flex-1" style={{ fontSize: 13 }}>{r.team.name}</span>
                          {r.error && <span className="text-caption" style={{ color: 'var(--danger)' }}>{r.error}</span>}
                        </div>
                      ))}
                    </div>
                    {failed > 0 && isAdmin && (
                      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                        <button onClick={() => retry(msg.id)} disabled={retrying === msg.id} className="btn btn-danger btn-sm">
                          {retrying === msg.id ? <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--danger)' }} /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Retry {failed} failed
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
