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
  recipients: {
    id: string;
    status: string;
    team: { name: string };
    error?: string;
  }[];
}

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: '#25D366',
  SMS: 'var(--blue)',
  INTERNAL: 'var(--text-muted)',
};

const STATUS_COLOR: Record<string, string> = {
  SENT: 'var(--green)',
  FAILED: 'var(--red)',
  QUEUED: 'var(--yellow)',
  PENDING: 'var(--border-accent)',
};

export function MessagesPage() {
  const { activeHackathon } = useHackathonStore();
  const { setBroadcastOpen, toast } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [messages, setMessages] = useState<MsgLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    if (!activeHackathon) return;
    setLoading(true);
    try {
      setMessages(
        await api.get<MsgLog[]>(`/hackathons/${activeHackathon.id}/messages`)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('message:status', load);
    return () => { socket.off('message:status', load); };
  }, [activeHackathon?.id]);

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-heading">Messages</h1>
          <p className="text-caption mt-0.5">{messages.length} broadcasts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary btn-icon btn-sm"
            onClick={load}
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {isAdmin && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setBroadcastOpen(true)}
            >
              <Send className="w-3.5 h-3.5" />
              Broadcast
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-4 w-2/3 rounded mb-2" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Send className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-title mb-2">No messages yet</p>
          <p className="text-caption mb-6">Broadcast to teams to get started</p>
          {isAdmin && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setBroadcastOpen(true)}
            >
              <Send className="w-3.5 h-3.5" />
              Send broadcast
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const sent = msg.recipients.filter((r) => r.status === 'SENT').length;
            const failed = msg.recipients.filter((r) => r.status === 'FAILED').length;
            const isExp = expanded === msg.id;
            const channelColor = CHANNEL_COLORS[msg.channel] || 'var(--text-muted)';

            return (
              <div
                key={msg.id}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExp ? null : msg.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors duration-100"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Status dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: STATUS_COLOR[msg.status] || 'var(--border-accent)' }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium truncate"
                      style={{ fontSize: 14 }}
                    >
                      {msg.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          background: `${channelColor}15`,
                          color: channelColor,
                          border: `1px solid ${channelColor}30`,
                        }}
                      >
                        {msg.channel}
                      </span>
                      <span className="text-caption">
                        {formatDateTime(msg.sentAt)} · {msg.sentBy.name}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                    <p
                      className="font-semibold"
                      style={{ fontSize: 12, color: 'var(--green)' }}
                    >
                      {sent} sent
                    </p>
                    {failed > 0 && (
                      <p
                        className="font-semibold"
                        style={{ fontSize: 12, color: 'var(--red)' }}
                      >
                        {failed} failed
                      </p>
                    )}
                    <ChevronDown
                      className="w-3.5 h-3.5 transition-transform duration-200 mt-0.5"
                      style={{
                        color: 'var(--text-muted)',
                        transform: isExp ? 'rotate(180deg)' : 'rotate(0)',
                      }}
                    />
                  </div>
                </button>

                {/* Expanded recipients */}
                {isExp && (
                  <div
                    className="border-t"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    {msg.recipients.slice(0, 20).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        {r.status === 'SENT' ? (
                          <CheckCircle2
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: 'var(--green)' }}
                          />
                        ) : r.status === 'FAILED' ? (
                          <XCircle
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: 'var(--red)' }}
                          />
                        ) : (
                          <Clock
                            className="w-3.5 h-3.5 flex-shrink-0"
                            style={{ color: 'var(--yellow)' }}
                          />
                        )}
                        <span className="flex-1" style={{ fontSize: 13 }}>
                          {r.team.name}
                        </span>
                        {r.error && (
                          <span
                            className="text-caption"
                            style={{ color: 'var(--red)' }}
                          >
                            {r.error}
                          </span>
                        )}
                      </div>
                    ))}
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
