import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';

export function CreateHackathonSheet() {
  const { setCreateHackathonOpen, toast } = useUIStore();
  const { createHackathon } = useHackathonStore();
  const [form, setForm] = useState({
    name: '', description: '', venue: '',
    startDate: '', endDate: '', maxTeams: '',
  });
  const [loading, setLoading] = useState(false);

  const close = () => setCreateHackathonOpen(false);

  const submit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast('Name and dates are required', 'error');
      return;
    }
    setLoading(true);
    try {
      await createHackathon({
        name: form.name,
        description: form.description || undefined,
        venue: form.venue || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        maxTeams: form.maxTeams ? parseInt(form.maxTeams) : undefined,
      });
      toast(`${form.name} created!`, 'success');
      close();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={close} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl shadow-modal animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 bg-line rounded-full" /></div>
        <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-ink rounded-2xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-bold text-base">New Hackathon</h2>
              <p className="text-xs text-ink-ghost">Create a new event workspace</p>
            </div>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full bg-line/60 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
          <input value={form.name} onChange={f('name')} placeholder="Hackathon name *" className="input" />
          <textarea value={form.description} onChange={f('description')} placeholder="Description (optional)" className="input resize-none" rows={3} />
          <input value={form.venue} onChange={f('venue')} placeholder="Venue (optional)" className="input" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-ink-ghost mb-1.5 font-medium">Start date *</p>
              <input type="datetime-local" value={form.startDate} onChange={f('startDate')} className="input text-sm" />
            </div>
            <div>
              <p className="text-xs text-ink-ghost mb-1.5 font-medium">End date *</p>
              <input type="datetime-local" value={form.endDate} onChange={f('endDate')} className="input text-sm" />
            </div>
          </div>
          <input type="number" value={form.maxTeams} onChange={f('maxTeams')} placeholder="Max teams (optional)" className="input" />
        </div>

        <div className="flex-shrink-0 px-5 py-4 border-t border-line/60 pb-safe">
          <button onClick={submit} disabled={loading} className="w-full btn-primary py-4 text-[15px]">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}
            {loading ? 'Creating…' : 'Create Hackathon'}
          </button>
        </div>
      </div>
    </>
  );
}
