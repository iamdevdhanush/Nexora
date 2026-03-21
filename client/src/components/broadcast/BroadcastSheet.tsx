import { useState } from 'react';
import { X, Send, Smartphone, MessageSquare, Globe } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Channel = 'WHATSAPP' | 'SMS' | 'INTERNAL';

const CHANNELS: { value: Channel; label: string; icon: typeof Send; desc: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: Smartphone, desc: 'WhatsApp Business' },
  { value: 'SMS', label: 'SMS', icon: Globe, desc: 'Via Twilio' },
  { value: 'INTERNAL', label: 'Internal', icon: MessageSquare, desc: 'Log only' },
];

export function BroadcastSheet() {
  const { setBroadcastOpen, toast } = useUIStore();
  const { activeHackathon } = useHackathonStore();
  const { teams } = useTeamsStore();

  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<Channel>('WHATSAPP');
  const [recipientType, setRecipientType] = useState<'all' | 'selected'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const close = () => setBroadcastOpen(false);

  const send = async () => {
    if (!activeHackathon || !message.trim()) return;
    setSending(true);
    try {
      const r = await api.post<{ queued: number }>(
        `/hackathons/${activeHackathon.id}/messages/broadcast`,
        {
          content: message.trim(),
          channel,
          teamIds: recipientType === 'all' ? 'all' : selectedIds,
        }
      );
      toast(`Queued for ${r.queued} teams`, 'success');
      close();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSending(false); }
  };

  const count = recipientType === 'all' ? teams.length : selectedIds.length;

  return (
    <>
      <div className="overlay animate-fade-in" onClick={close} />
      <div className="sheet animate-slide-up flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="sheet-handle" />

        <div className="flex items-center justify-between px-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-bold" style={{ fontSize: 16 }}>Broadcast</h2>
            <p className="text-caption mt-0.5">Send a message to teams</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Channel */}
          <div>
            <p className="text-label mb-2">Channel</p>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setChannel(value)}
                  className="flex flex-col items-start gap-2 p-3 rounded-lg border-2 text-left transition-all duration-150"
                  style={{
                    borderColor: channel === value ? '#0A0A0A' : 'var(--border)',
                    background: channel === value ? 'var(--bg-subtle)' : 'var(--bg)',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: channel === value ? '#0A0A0A' : 'var(--text-muted)' }} />
                  <p className="font-semibold" style={{ fontSize: 12 }}>{label}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <p className="text-label mb-2">Recipients</p>
            <div className="flex gap-2">
              <button
                onClick={() => setRecipientType('all')}
                className="flex-1 py-2.5 rounded-lg font-semibold border-2 transition-all duration-150 text-sm"
                style={{
                  borderColor: recipientType === 'all' ? '#0A0A0A' : 'var(--border)',
                  background: recipientType === 'all' ? '#0A0A0A' : 'var(--bg)',
                  color: recipientType === 'all' ? 'white' : 'var(--text-secondary)',
                }}
              >
                All ({teams.length})
              </button>
              <button
                onClick={() => setRecipientType('selected')}
                className="flex-1 py-2.5 rounded-lg font-semibold border-2 transition-all duration-150 text-sm"
                style={{
                  borderColor: recipientType === 'selected' ? '#0A0A0A' : 'var(--border)',
                  background: recipientType === 'selected' ? '#0A0A0A' : 'var(--bg)',
                  color: recipientType === 'selected' ? 'white' : 'var(--text-secondary)',
                }}
              >
                Select {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
            </div>

            {recipientType === 'selected' && (
              <div
                className="mt-2 rounded-lg border overflow-hidden max-h-40 overflow-y-auto"
                style={{ borderColor: 'var(--border)' }}
              >
                {teams.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b last:border-0 transition-colors duration-100"
                    style={{ borderColor: 'var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(t.id)}
                      onChange={() =>
                        setSelectedIds((p) =>
                          p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]
                        )
                      }
                      className="w-4 h-4 rounded accent-[#0A0A0A]"
                    />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <p className="text-label mb-2">Message</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Type your message…"
              className="input"
              style={{ height: 'auto' }}
            />
            <p className="text-right text-caption mt-1">{message.length}/500</p>
          </div>
        </div>

        <div
          className="flex items-center justify-between px-5 py-4 border-t"
          style={{ borderColor: 'var(--border)', paddingBottom: 'calc(16px + var(--safe-bottom))' }}
        >
          <p className="text-caption">{count} recipient{count !== 1 ? 's' : ''}</p>
          <button
            onClick={send}
            disabled={sending || !message.trim() || count === 0}
            className="btn btn-primary"
          >
            {sending ? (
              <div className="spinner-white" style={{ width: 14, height: 14 }} />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send to {count}
          </button>
        </div>
      </div>
    </>
  );
}
