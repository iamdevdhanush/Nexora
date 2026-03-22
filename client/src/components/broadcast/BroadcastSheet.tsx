import { useState } from 'react';
import { X, Send, Smartphone, MessageSquare, Globe } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { api } from '@/lib/api';

type Channel = 'WHATSAPP' | 'SMS' | 'INTERNAL';

const CHANNELS: {
  value: Channel;
  label: string;
  icon: typeof Smartphone;
  desc: string;
  color: string;
}[] = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: Smartphone, desc: 'WhatsApp Business', color: '#25D366' },
  { value: 'SMS', label: 'SMS', icon: Globe, desc: 'Via Twilio', color: 'var(--blue)' },
  { value: 'INTERNAL', label: 'Internal', icon: MessageSquare, desc: 'Log only', color: 'var(--text-muted)' },
];

export function BroadcastSheet() {
  const { setBroadcastOpen, toast } = useUIStore();
  const { activeHackathon } = useHackathonStore();
  const { teams } = useTeamsStore();
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<Channel>('WHATSAPP');
  const [sending, setSending] = useState(false);
  const close = () => setBroadcastOpen(false);

  const send = async () => {
    if (!activeHackathon || !message.trim()) return;
    setSending(true);
    try {
      const r = await api.post<{ queued: number }>(
        `/hackathons/${activeHackathon.id}/messages/broadcast`,
        { content: message.trim(), channel, teamIds: 'all' }
      );
      toast(`Queued for ${r.queued} teams`, 'success');
      close();
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="overlay animate-fade-in" onClick={close} />
      <div className="sheet animate-slide-up flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle" />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pb-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="font-display font-bold" style={{ fontSize: 17, letterSpacing: '-0.02em' }}>
              Broadcast
            </h2>
            <p className="text-caption mt-0.5">Send to all {teams.length} teams</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Channel selector */}
          <div>
            <p className="text-label mb-3">Channel</p>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(({ value, label, icon: Icon, desc, color }) => {
                const active = channel === value;
                return (
                  <button
                    key={value}
                    onClick={() => setChannel(value)}
                    className="flex flex-col items-start gap-2 p-3 rounded-xl border-2 text-left transition-all duration-150"
                    style={{
                      borderColor: active ? color : 'var(--border)',
                      background: active ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: active ? color : 'var(--text-muted)' }}
                    />
                    <p className="font-semibold" style={{ fontSize: 12, color: active ? 'var(--text)' : 'var(--text-secondary)' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-label mb-2">Message</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Type your message to all teams…"
              className="input"
              style={{ height: 'auto' }}
            />
            <p className="text-right text-caption mt-1">{message.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-4 border-t"
          style={{
            borderColor: 'var(--border)',
            paddingBottom: 'calc(16px + var(--safe-bottom))',
          }}
        >
          <p className="text-caption">
            {teams.length} recipient{teams.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={send}
            disabled={sending || !message.trim() || teams.length === 0}
            className="btn btn-green"
          >
            {sending ? (
              <div className="spinner-white" style={{ width: 14, height: 14 }} />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send to {teams.length}
          </button>
        </div>
      </div>
    </>
  );
}
