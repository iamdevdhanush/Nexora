import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';

export function CreateHackathonSheet() {
  const { setCreateHackathonOpen, toast } = useUIStore();
  const { createHackathon } = useHackathonStore();
  const [form, setForm] = useState({ name: '', description: '', venue: '', startDate: '', endDate: '', maxTeams: '', mode: 'PREDEFINED' as 'PREDEFINED' | 'ON_SPOT' });
  const [loading, setLoading] = useState(false);
  const close = () => setCreateHackathonOpen(false);

  const submit = async () => {
    if (!form.name || !form.startDate || !form.endDate) { toast('Name and dates are required', 'error'); return; }
    setLoading(true);
    try {
      await createHackathon({ name: form.name, description: form.description || undefined, venue: form.venue || undefined, startDate: form.startDate, endDate: form.endDate, maxTeams: form.maxTeams ? parseInt(form.maxTeams) : undefined, mode: form.mode });
      toast(`${form.name} created!`, 'success'); close();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <div className="overlay animate-fade-in" onClick={close} />
      <div className="sheet animate-slide-up flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />
        <div className="flex items-center justify-between px-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#0A0A0A' }}><Zap className="w-4 h-4 text-white" strokeWidth={2.5} /></div>
            <div><h2 className="font-bold" style={{ fontSize: 16 }}>New hackathon</h2><p className="text-caption mt-0.5">Create an event workspace</p></div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <input value={form.name} onChange={f('name')} placeholder="Hackathon name *" className="input" />
          <textarea value={form.description} onChange={f('description')} placeholder="Description (optional)" className="input" rows={2} />
          <input value={form.venue} onChange={f('venue')} placeholder="Venue (optional)" className="input" />
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-caption mb-1.5">Start date *</p><input type="datetime-local" value={form.startDate} onChange={f('startDate')} className="input" style={{ fontSize: 13 }} /></div>
            <div><p className="text-caption mb-1.5">End date *</p><input type="datetime-local" value={form.endDate} onChange={f('endDate')} className="input" style={{ fontSize: 13 }} /></div>
          </div>
          <input type="number" value={form.maxTeams} onChange={f('maxTeams')} placeholder="Max teams (optional)" className="input" />
          <div>
            <p className="text-caption mb-1.5">Problem statement mode</p>
            <select value={form.mode} onChange={f('mode')} className="input">
              <option value="PREDEFINED">Predefined — teams choose a problem</option>
              <option value="ON_SPOT">On-spot — coordinators assign problems</option>
            </select>
          </div>
        </div>
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)', paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <button onClick={submit} disabled={loading} className="btn btn-primary w-full" style={{ height: 42 }}>
            {loading ? <div className="spinner-white" style={{ width: 16, height: 16 }} /> : <Zap className="w-4 h-4" />}
            {loading ? 'Creating…' : 'Create hackathon'}
          </button>
        </div>
      </div>
    </>
  );
}
