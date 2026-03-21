import { useState, useEffect } from 'react';
import { X, Phone, UserCheck, RotateCcw, MessageSquare, Edit2, Check, MapPin, ExternalLink } from 'lucide-react';
import { Team, TeamStatus, useTeamsStore } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn, formatDateTime, initials } from '@/lib/utils';

const STATUS_ACTIONS: { from: TeamStatus[]; to: TeamStatus; label: string; style: string }[] = [
  { from: ['REGISTERED'], to: 'CHECKED_IN', label: 'Check in', style: 'btn-accent' },
  { from: ['CHECKED_IN'], to: 'ACTIVE', label: 'Mark active', style: 'btn-secondary' },
  { from: ['ACTIVE'], to: 'SUBMITTED', label: 'Mark submitted', style: 'btn-secondary' },
  { from: ['CHECKED_IN', 'ACTIVE', 'SUBMITTED'], to: 'REGISTERED', label: 'Undo check-in', style: 'btn-ghost' },
];

export function TeamDrawer({ team, onClose }: { team: Team; onClose: () => void }) {
  const { activeHackathon } = useHackathonStore();
  const { updateTeam, checkIn } = useTeamsStore();
  const { toast, setBroadcastOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [editingRoom, setEditingRoom] = useState(false);
  const [roomVal, setRoomVal] = useState(team.room ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeHackathon || !isAdmin) return;
    api.get<any[]>(`/hackathons/${activeHackathon.id}/coordinators`).then(setCoordinators).catch(() => {});
  }, [activeHackathon?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleStatus = async (to: TeamStatus) => {
    if (!activeHackathon) return;
    setSaving(true);
    try {
      if (to === 'CHECKED_IN') await checkIn(activeHackathon.id, team.id);
      else await updateTeam(activeHackathon.id, team.id, { status: to });
      toast(`Status → ${to.replace('_', ' ')}`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const saveRoom = async () => {
    if (!activeHackathon) return;
    await updateTeam(activeHackathon.id, team.id, { room: roomVal });
    setEditingRoom(false);
    toast('Room updated', 'success');
  };

  const actions = STATUS_ACTIONS.filter((a) => a.from.includes(team.status));

  return (
    <>
      <div className="overlay animate-fade-in" onClick={onClose} />
      <div className="sheet animate-slide-up flex flex-col" style={{ maxHeight: '92vh' }}>
        <div className="sheet-handle" />
        <div className="flex items-center gap-3 px-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 13, background: '#0A0A0A' }}>
            {initials(team.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold truncate" style={{ fontSize: 16 }}>{team.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn('badge', `badge-${team.status.toLowerCase()}`)}>{team.status.replace('_', ' ')}</span>
              {team.room && <span className="text-caption font-mono">{team.room}</span>}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isAdmin && actions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {actions.map((a) => (
                <button key={a.to} onClick={() => handleStatus(a.to)} disabled={saving} className={cn('btn', a.style)}>
                  {a.to === 'CHECKED_IN' && <UserCheck className="w-3.5 h-3.5" />}
                  {a.to === 'REGISTERED' && <RotateCcw className="w-3.5 h-3.5" />}
                  {a.label}
                </button>
              ))}
            </div>
          )}

          <div>
            <p className="text-label mb-2">Members ({team.participants.length})</p>
            <div className="card overflow-hidden">
              {team.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ fontSize: 10, background: p.isLeader ? '#0A0A0A' : 'var(--bg-muted)', color: p.isLeader ? 'white' : 'var(--text-secondary)' }}>
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ fontSize: 14 }}>
                      {p.name}
                      {p.isLeader && <span className="ml-2 px-1.5 py-0.5 rounded text-white font-semibold uppercase" style={{ fontSize: 9, letterSpacing: '0.05em', background: '#0A0A0A' }}>Leader</span>}
                    </p>
                    {p.email && <p className="text-caption truncate">{p.email}</p>}
                  </div>
                  {p.phone && <a href={`tel:${p.phone}`} className="btn btn-ghost btn-icon btn-sm" onClick={(e) => e.stopPropagation()}><Phone className="w-3.5 h-3.5" /></a>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-label mb-2">Room / Table</p>
            {editingRoom ? (
              <div className="flex gap-2">
                <input autoFocus value={roomVal} onChange={(e) => setRoomVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveRoom(); if (e.key === 'Escape') setEditingRoom(false); }}
                  className="input flex-1 font-mono" placeholder="e.g. A-101" />
                <button className="btn btn-primary btn-icon" onClick={saveRoom}><Check className="w-4 h-4" /></button>
                <button className="btn btn-secondary btn-icon" onClick={() => setEditingRoom(false)}><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => isAdmin && setEditingRoom(true)}
                className="card w-full flex items-center justify-between px-4 py-3 transition-colors duration-100"
                style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                onMouseEnter={(e) => isAdmin && (e.currentTarget.style.background = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg)')}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <span className="font-mono" style={{ fontSize: 14 }}>{team.room || 'Not assigned'}</span>
                </div>
                {isAdmin && <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
              </button>
            )}
          </div>

          {isAdmin && (
            <div>
              <p className="text-label mb-2">Coordinator</p>
              <select value={team.coordinator?.id ?? ''} onChange={(e) => updateTeam(activeHackathon!.id, team.id, { coordinatorId: e.target.value || undefined })} className="input">
                <option value="">Unassigned</option>
                {coordinators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {team.checkInTime && (
            <div>
              <p className="text-label mb-2">Timeline</p>
              <div className="card px-4 py-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Checked in</span>
                  <span className="font-mono text-caption">{formatDateTime(team.checkInTime)}</span>
                </div>
                {team.submissionTime && (
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Submitted</span>
                    <span className="font-mono text-caption">{formatDateTime(team.submissionTime)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {team.projectName && (
            <div>
              <p className="text-label mb-2">Project</p>
              <div className="card px-4 py-3">
                <p className="font-semibold" style={{ fontSize: 14 }}>{team.projectName}</p>
                {team.projectUrl && (
                  <a href={team.projectUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-caption mt-1" style={{ color: 'var(--accent)' }} onClick={(e) => e.stopPropagation()}>
                    {team.projectUrl}<ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {isAdmin && team.leaderPhone && (
          <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border)', paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
            <button onClick={() => { setBroadcastOpen(true); onClose(); }} className="btn btn-secondary flex-1">
              <MessageSquare className="w-4 h-4" />Message
            </button>
            <a href={`https://wa.me/${team.leaderPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener"
              className="btn flex-1 font-semibold text-white" style={{ background: '#25D366' }}>
              <Phone className="w-4 h-4" />WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}
