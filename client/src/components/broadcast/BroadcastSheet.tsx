import { useState } from 'react';
import { X, Send, Smartphone, MessageSquare, Globe } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { api } from '@/lib/api';

type Channel = 'WHATSAPP' | 'SMS' | 'INTERNAL';
const CHANNELS = [
  { value: 'WHATSAPP' as Channel, label: 'WhatsApp', icon: Smartphone, desc: 'WhatsApp Business' },
  { value: 'SMS' as Channel, label: 'SMS', icon: Globe, desc: 'Via Twilio' },
  { value: 'INTERNAL' as Channel, label: 'Internal', icon: MessageSquare, desc: 'Log only' },
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
      const r = await api.post<{ queued: number }>(`/hackathons/${activeHackathon.id}/messages/broadcast`, { content: message.trim(), channel, teamIds: recipientType === 'all' ? 'all' : selectedIds });
      toast(`Queued for ${r.queued} teams`, 'success'); close();
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
          <div><h2 className="font-bold" style={{ fontSize: 16 }}>Broadcast message</h2><p className="text-caption mt-0.5">Send to teams</p></div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <p className="text-label mb-2">Channel</p>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(({ value, label, icon: Icon, desc }) => (
                <button key={value} onClick={() => setChannel(value)} className="flex flex-col items-start gap-2 p-3 rounded-lg border-2 text-left transition-all duration-150"
                  style={{ borderColor: channel === value ? '#0A0A0A' : 'var(--border)', background: channel === value ? 'var(--bg-subtle)' : 'var(--bg)' }}>
                  <Icon className="w-4 h-4" style={{ color: channel === value ? '#0A0A0A' : 'var(--text-muted)' }} />
                  <p className="font-semibold" style={{ fontSize: 12 }}>{label}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={500} placeholder="Type your message to all teams..." className="input" style={{ height: 'auto' }} />
            <p className="text-right text-caption mt-1">{message.length}/500</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'var(--border)', paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <p className="text-caption">{count} recipient{count !== 1 ? 's' : ''}</p>
          <button onClick={send} disabled={sending || !message.trim() || count === 0} className="btn btn-primary">
            {sending ? <div className="spinner-white" style={{ width: 14, height: 14 }} /> : <Send className="w-4 h-4" />}
            Send to {count}
          </button>
        </div>
      </div>
    </>
  );
}
