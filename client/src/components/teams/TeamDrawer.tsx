import { useState, useEffect } from 'react';
import { X, Phone, UserCheck, RotateCcw, MessageSquare, Edit2, Check, MapPin, User, Users, Clock, ChevronRight } from 'lucide-react';
import { Team, TeamStatus, useTeamsStore } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn, formatDateTime, initials } from '@/lib/utils';

const STATUS_FLOW: { from: TeamStatus[]; to: TeamStatus; label: string; cls: string }[] = [
  { from: ['REGISTERED'], to: 'CHECKED_IN', label: 'Check In', cls: 'bg-success text-white' },
  { from: ['CHECKED_IN'], to: 'ACTIVE', label: 'Mark Active', cls: 'bg-amber text-white' },
  { from: ['ACTIVE'], to: 'SUBMITTED', label: 'Mark Submitted', cls: 'bg-brand text-white' },
  { from: ['CHECKED_IN', 'ACTIVE', 'SUBMITTED'], to: 'REGISTERED', label: 'Undo Check-in', cls: 'bg-line text-ink' },
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
    if (!activeHackathon) return;
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

  const handleCoordinator = async (coordinatorId: string) => {
    if (!activeHackathon) return;
    await updateTeam(activeHackathon.id, team.id, { coordinatorId: coordinatorId || null });
    toast('Coordinator assigned', 'success');
  };

  const actions = STATUS_FLOW.filter((a) => a.from.includes(team.status));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-3xl shadow-modal animate-slide-up max-h-[92vh] flex flex-col">
        {/* Handle */}
        <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-2">
          <div className="w-10 h-1 bg-line rounded-full" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 pb-4 border-b border-line/60">
          <div className="w-11 h-11 rounded-full bg-ink/6 flex items-center justify-center text-base font-bold text-ink">
            {initials(team.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base text-ink truncate">{team.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`badge badge-${team.status.toLowerCase()}`}>{team.status.replace('_', ' ')}</span>
              {team.room && <span className="text-xs text-ink-ghost font-mono">{team.room}</span>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-line/60 flex items-center justify-center">
            <X className="w-4 h-4 text-ink-muted" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-safe">
          {/* Status actions */}
          {isAdmin && actions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {actions.map((a) => (
                <button
                  key={a.to}
                  onClick={() => handleStatus(a.to)}
                  disabled={saving}
                  className={cn('flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold press-sm disabled:opacity-50', a.cls)}
                >
                  {a.to === 'CHECKED_IN' && <UserCheck className="w-4 h-4" />}
                  {a.to === 'REGISTERED' && <RotateCcw className="w-4 h-4" />}
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Members */}
          <div>
            <p className="section-label">Members ({team.participants.length})</p>
            <div className="card-flat overflow-hidden divide-y divide-line/60">
              {team.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-ink/6 flex items-center justify-center text-xs font-bold">
                    {initials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {p.name}
                      {p.isLeader && <span className="text-[9px] bg-ink text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Leader</span>}
                    </p>
                    {p.email && <p className="text-xs text-ink-ghost truncate">{p.email}</p>}
                  </div>
                  {p.phone && (
                    <a href={`tel:${p.phone}`} className="w-8 h-8 bg-line/60 rounded-full flex items-center justify-center press-sm">
                      <Phone className="w-3.5 h-3.5 text-ink-muted" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Room */}
          <div>
            <p className="section-label">Room / Table</p>
            {editingRoom ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={roomVal}
                  onChange={(e) => setRoomVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveRoom(); if (e.key === 'Escape') setEditingRoom(false); }}
                  className="input flex-1"
                  placeholder="e.g. A-101"
                />
                <button onClick={saveRoom} className="w-11 h-11 bg-ink text-white rounded-2xl flex items-center justify-center press-sm">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingRoom(false)} className="w-11 h-11 bg-line rounded-2xl flex items-center justify-center press-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => isAdmin && setEditingRoom(true)}
                className="w-full flex items-center justify-between px-4 py-3 card-flat press-sm"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-ink-ghost" />
                  <span className="font-mono text-sm">{team.room || 'Not assigned'}</span>
                </div>
                {isAdmin && <Edit2 className="w-3.5 h-3.5 text-ink-ghost" />}
              </button>
            )}
          </div>

          {/* Coordinator */}
          {isAdmin && (
            <div>
              <p className="section-label">Coordinator</p>
              <select
                value={team.coordinator?.id ?? ''}
                onChange={(e) => handleCoordinator(e.target.value)}
                className="input"
              >
                <option value="">Unassigned</option>
                {coordinators.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Timeline */}
          {team.checkInTime && (
            <div>
              <p className="section-label">Timeline</p>
              <div className="card-flat px-4 py-3 space-y-2">
                {team.checkInTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-ink-muted">Checked in</span>
                    <span className="font-mono text-xs">{formatDateTime(team.checkInTime)}</span>
                  </div>
                )}
                {team.submissionTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-ink-muted">Submitted</span>
                    <span className="font-mono text-xs">{formatDateTime(team.submissionTime)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Project */}
          {team.projectName && (
            <div>
              <p className="section-label">Project</p>
              <div className="card-flat px-4 py-3">
                <p className="font-semibold text-sm">{team.projectName}</p>
                {team.projectUrl && (
                  <a href={team.projectUrl} target="_blank" rel="noopener" className="text-xs text-brand mt-0.5 block">
                    {team.projectUrl}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isAdmin && team.leaderPhone && (
          <div className="flex-shrink-0 flex gap-3 px-5 py-4 border-t border-line/60 pb-safe">
            <button
              onClick={() => { setBroadcastOpen(true); onClose(); }}
              className="flex-1 btn-secondary text-sm py-3"
            >
              <MessageSquare className="w-4 h-4" /> Message
            </button>
            <a
              href={`https://wa.me/${team.leaderPhone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-2xl font-semibold text-sm press-sm"
            >
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}
