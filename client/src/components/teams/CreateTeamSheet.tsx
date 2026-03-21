import { useState } from 'react';
import { X, Users, Plus, Trash2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';

interface Member { name: string; email: string; isLeader: boolean; }

export function CreateTeamSheet() {
  const { setCreateTeamOpen, toast } = useUIStore();
  const { activeHackathon } = useHackathonStore();
  const { createTeam } = useTeamsStore();
  const [name, setName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [room, setRoom] = useState('');
  const [members, setMembers] = useState<Member[]>([{ name: '', email: '', isLeader: true }]);
  const [loading, setLoading] = useState(false);
  const close = () => setCreateTeamOpen(false);

  const addMember = () => setMembers((m) => [...m, { name: '', email: '', isLeader: false }]);
  const removeMember = (i: number) => setMembers((m) => m.filter((_, idx) => idx !== i));
  const updateMember = (i: number, key: keyof Member, val: string | boolean) => setMembers((m) => m.map((mem, idx) => idx === i ? { ...mem, [key]: val } : mem));

  const submit = async () => {
    if (!name.trim() || !activeHackathon) { toast('Team name required', 'error'); return; }
    setLoading(true);
    try {
      await createTeam(activeHackathon.id, { name: name.trim(), leaderPhone: leaderPhone || undefined, room: room || undefined, participants: members.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), email: m.email || undefined, isLeader: m.isLeader })) as any });
      toast(`Team "${name}" created!`, 'success'); close();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="overlay animate-fade-in" onClick={close} />
      <div className="sheet animate-slide-up flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />
        <div className="flex items-center justify-between px-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--blue-bg)' }}><Users className="w-4 h-4" style={{ color: 'var(--blue)' }} /></div>
            <div><h2 className="font-bold" style={{ fontSize: 16 }}>New team</h2><p className="text-caption mt-0.5">Add a team to this hackathon</p></div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={close}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-label mb-2">Team details</p>
            <div className="space-y-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name *" className="input" />
              <div className="grid grid-cols-2 gap-2">
                <input value={leaderPhone} onChange={(e) => setLeaderPhone(e.target.value)} placeholder="Leader phone" className="input" type="tel" />
                <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room / table" className="input" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-label">Members</p>
              <button onClick={addMember} className="btn btn-ghost btn-sm gap-1" style={{ fontSize: 12 }}><Plus className="w-3 h-3" />Add</button>
            </div>
            <div className="space-y-2">
              {members.map((member, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1.5 p-3 rounded-lg" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      {member.isLeader && <span className="px-1.5 py-0.5 rounded text-white font-semibold uppercase" style={{ fontSize: 9, letterSpacing: '0.05em', background: '#0A0A0A' }}>Leader</span>}
                      <input value={member.name} onChange={(e) => updateMember(i, 'name', e.target.value)} placeholder="Member name" className="input" style={{ height: 30, fontSize: 13 }} />
                    </div>
                    <input value={member.email} onChange={(e) => updateMember(i, 'email', e.target.value)} placeholder="Email (optional)" type="email" className="input" style={{ height: 30, fontSize: 13 }} />
                  </div>
                  {i > 0 && <button onClick={() => removeMember(i)} className="btn btn-ghost btn-icon btn-sm mt-1" style={{ color: 'var(--danger)' }}><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)', paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <button onClick={submit} disabled={loading || !name.trim()} className="btn btn-primary w-full" style={{ height: 42 }}>
            {loading ? <div className="spinner-white" style={{ width: 16, height: 16 }} /> : <Users className="w-4 h-4" />}
            {loading ? 'Creating…' : 'Create team'}
          </button>
        </div>
      </div>
    </>
  );
}
