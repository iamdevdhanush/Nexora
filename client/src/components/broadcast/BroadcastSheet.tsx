import { useState } from 'react';
import { X, Send, Smartphone, MessageSquare, Globe } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Channel = 'WHATSAPP' | 'SMS' | 'INTERNAL';

const CHANNELS: { value: Channel; label: string; icon: typeof Send; desc: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp', icon: Smartphone, desc: 'Via WhatsApp Business' },
  { value: 'SMS', label: 'SMS', icon: Globe, desc: 'Via Twilio/MSG91' },
  { value: 'INTERNAL', label: 'Log only', icon: MessageSquare, desc: 'Dashboard log' },
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
      const r = await api.post<{ queued: number }>(`/hackathons/${activeHackathon.id}/messages/broadcast`, {
        content: message.trim(),
        channel,
        teamIds: recipientType === 'all' ? 'all' : selectedIds,
      });
      toast(`Queued for ${r.queued} teams`, 'success');
      close();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSending(false); }
  };

  const count = recipientType === 'all' ? teams.length : selectedIds.length;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={close} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl shadow-modal animate-slide-up max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
          <div>
            <h2 className="font-bold text-base">Broadcast</h2>
            <p className="text-xs text-ink-ghost mt-0.5">Send message to teams</p>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full bg-line/60 flex items-center justify-center">
            <X className="w-4 h-4 text-ink-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          {/* Channel */}
          <div>
            <p className="section-label">Channel</p>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setChannel(value)}
                  className={cn(
                    'flex flex-col items-start gap-1.5 p-3 rounded-2xl border-2 text-left transition-all press-sm',
                    channel === value ? 'border-ink bg-ink/4' : 'border-line hover:border-line-strong'
                  )}
                >
                  <Icon className={cn('w-4 h-4', channel === value ? 'text-ink' : 'text-ink-ghost')} />
                  <p className="text-xs font-bold">{label}</p>
                  <p className="text-[10px] text-ink-ghost leading-tight">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <p className="section-label">Recipients</p>
            <div className="flex gap-2">
              <button
                onClick={() => setRecipientType('all')}
                className={cn('flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all press-sm',
                  recipientType === 'all' ? 'border-ink bg-ink text-white' : 'border-line text-ink-muted hover:border-line-strong')}
              >
                All ({teams.length})
              </button>
              <button
                onClick={() => setRecipientType('selected')}
                className={cn('flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all press-sm',
                  recipientType === 'selected' ? 'border-ink bg-ink text-white' : 'border-line text-ink-muted hover:border-line-strong')}
              >
                Select {selectedIds.length > 0 && `(${selectedIds.length})`}
              </button>
            </div>

            {recipientType === 'selected' && (
              <div className="mt-2 card-flat overflow-hidden max-h-40 overflow-y-auto divide-y divide-line/60">
                {teams.map((t) => (
                  <label key={t.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(t.id)}
                      onChange={() => setSelectedIds((p) => p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id])}
                      className="w-4 h-4 rounded accent-ink"
                    />
                    <span className="text-sm font-medium">{t.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <p className="section-label">Message</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder={`"HackOS Alert: Team {name}, {message}"`}
              className="input resize-none"
            />
            <p className="text-right text-xs text-ink-ghost mt-1">{message.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-t border-line/60 pb-safe">
          <p className="text-sm text-ink-ghost">{count} recipient{count !== 1 ? 's' : ''}</p>
          <button
            onClick={send}
            disabled={sending || !message.trim() || count === 0}
            className="btn-primary py-3 px-6 disabled:opacity-40"
          >
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Send to {count}
          </button>
        </div>
      </div>
    </>
  );
}
