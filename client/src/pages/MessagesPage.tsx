import { useEffect, useState } from 'react';
import { Send, RefreshCw, CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { cn, formatDateTime } from '@/lib/utils';

interface MsgLog {
  id: string;
  content: string;
  channel: string;
  status: string;
  sentAt: string;
  sentBy: { name: string };
  recipients: { id: string; status: string; team: { name: string }; error?: string }[];
}

const CH_COLOR: Record<string, string> = {
  WHATSAPP: 'bg-[#25D366]/10 text-[#128C3E]',
  SMS: 'bg-brand-soft text-brand',
  INTERNAL: 'bg-line text-ink-muted',
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
    try {
      const data = await api.get<MsgLog[]>(`/hackathons/${activeHackathon.id}/messages`);
      setMessages(data);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('message:status', () => load());
    return () => { socket.off('message:status'); };
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
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-2xl bg-line/60 press-sm">
            <RefreshCw className="w-4 h-4 text-ink-muted" />
          </button>
          {isAdmin && (
            <button onClick={() => setBroadcastOpen(true)} className="btn-primary py-2 px-4 text-sm">
              <Send className="w-3.5 h-3.5" /> Broadcast
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-ink-ghost">
          <Send className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const sent = msg.recipients.filter((r) => r.status === 'SENT').length;
            const failed = msg.recipients.filter((r) => r.status === 'FAILED').length;
            const isExp = expanded === msg.id;
            return (
              <div key={msg.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpanded(isExp ? null : msg.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
                    msg.status === 'SENT' ? 'bg-success' :
                    msg.status === 'FAILED' ? 'bg-danger' : 'bg-amber'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', CH_COLOR[msg.channel] || CH_COLOR.INTERNAL)}>
                        {msg.channel}
                      </span>
                      <span className="text-xs text-ink-ghost">{formatDateTime(msg.sentAt)} · {msg.sentBy.name}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-success">{sent} sent</p>
                    {failed > 0 && <p className="text-xs font-semibold text-danger">{failed} failed</p>}
                    <ChevronDown className={cn('w-3.5 h-3.5 text-ink-ghost mx-auto mt-0.5 transition-transform', isExp && 'rotate-180')} />
                  </div>
                </button>

                {isExp && (
                  <div className="border-t border-line/60 bg-surface divide-y divide-line/60">
                    {msg.recipients.slice(0, 20).map((r) => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                        {r.status === 'SENT'
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                          : r.status === 'FAILED'
                          ? <XCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                          : <Clock className="w-3.5 h-3.5 text-amber flex-shrink-0" />}
                        <span className="text-sm flex-1">{r.team.name}</span>
                        {r.error && <span className="text-xs text-danger">{r.error}</span>}
                      </div>
                    ))}
                    {failed > 0 && isAdmin && (
                      <div className="px-4 py-3">
                        <button
                          onClick={() => retry(msg.id)}
                          disabled={retrying === msg.id}
                          className="btn-danger text-xs py-2 px-4"
                        >
                          {retrying === msg.id ? <div className="w-3.5 h-3.5 border-2 border-danger/30 border-t-danger rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
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
