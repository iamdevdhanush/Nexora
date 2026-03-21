import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Activity, Settings, ChevronLeft, Link2, UserPlus, Trash2, Check } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';

type Tab = 'overview' | 'coordinators' | 'activity' | 'settings';
interface Coordinator { assignmentId: string; id: string; name: string; email?: string; assignedTeamCount: number; }
interface ActivityLog { id: string; action: string; timestamp: string; actor: { name: string }; }

export function HackathonDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hackathons, setActiveHackathon, updateHackathon, deleteHackathon } = useHackathonStore();
  const { user } = useAuthStore();
  const { toast, setInviteOpen } = useUIStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const hackathon = hackathons.find((h) => h.id === id);
  const [tab, setTab] = useState<Tab>('overview');
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(hackathon?.name || '');

  useEffect(() => {
    if (!id) return;
    if (tab === 'coordinators') { setLoading(true); api.get<Coordinator[]>(`/hackathons/${id}/coordinators`).then(setCoordinators).finally(() => setLoading(false)); }
    if (tab === 'activity') { setLoading(true); api.get<ActivityLog[]>(`/hackathons/${id}/activity`).then(setActivity).finally(() => setLoading(false)); }
  }, [tab, id]);

  if (!hackathon) return <div className="flex items-center justify-center h-64"><p className="text-caption">Hackathon not found</p></div>;

  const saveName = async () => {
    if (!nameVal.trim()) return;
    try { await updateHackathon(hackathon.id, { name: nameVal.trim() }); toast('Name updated', 'success'); setEditName(false); }
    catch (e: any) { toast(e.message, 'error'); }
  };

  const handleDelete = async () => {
    try { await deleteHackathon(hackathon.id); toast('Hackathon deleted', 'success'); navigate('/hackathons'); }
    catch (e: any) { toast(e.message, 'error'); }
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'coordinators', label: 'Coordinators', icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'activity', label: 'Activity', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <button onClick={() => navigate('/hackathons')} className="flex items-center gap-1.5 text-caption mb-5 hover:text-[var(--text)] transition-colors"><ChevronLeft className="w-3.5 h-3.5" />Back to hackathons</button>
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          {editName ? (
            <div className="flex items-center gap-2">
              <input autoFocus value={nameVal} onChange={(e) => setNameVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false); }} className="input text-heading flex-1" style={{ height: 38 }} />
              <button onClick={saveName} className="btn btn-primary btn-icon btn-sm"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <h1 className="text-heading cursor-pointer" onClick={() => isAdmin && setEditName(true)}>{hackathon.name}</h1>
          )}
          <p className="text-caption mt-1">{formatDate(hackathon.startDate)} → {formatDate(hackathon.endDate)}</p>
        </div>
        <span className={cn('badge mt-1 ml-3 flex-shrink-0', hackathon.status === 'ACTIVE' ? 'badge-checked_in' : hackathon.status === 'ENDED' ? 'badge-ended' : 'badge-draft')}>{hackathon.status}</span>
      </div>
      <div className="tab-bar mb-6">
        {TABS.map((t) => <button key={t.key} onClick={() => setTab(t.key)} className={cn('tab-item', tab === t.key && 'active')}>{t.icon}{t.label}</button>)}
      </div>
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <p className="text-label">Details</p>
            {[{ label: 'Venue', value: hackathon.venue || 'Not set' }, { label: 'Max teams', value: hackathon.maxTeams?.toString() || 'Unlimited' }, { label: 'Mode', value: hackathon.mode?.replace('_', ' ') || 'Predefined' }, { label: 'Total teams', value: `${hackathon._count?.teams ?? 0}` }].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}><span className="text-caption">{label}</span><span className="font-medium" style={{ fontSize: 14 }}>{value}</span></div>
            ))}
          </div>
          {isAdmin && <div className="card p-4"><p className="text-label mb-3">Quick actions</p><div className="grid grid-cols-2 gap-2"><button onClick={() => { setActiveHackathon(hackathon); setInviteOpen(true); }} className="btn btn-outline"><Link2 className="w-3.5 h-3.5" />Invite coordinators</button><button onClick={() => navigate('/teams')} className="btn btn-outline"><Users className="w-3.5 h-3.5" />Manage teams</button></div></div>}
        </div>
      )}
      {tab === 'coordinators' && (
        <div className="space-y-3">
          {isAdmin && <button onClick={() => { setActiveHackathon(hackathon); setInviteOpen(true); }} className="btn btn-primary w-full"><UserPlus className="w-4 h-4" />Invite coordinator via link</button>}
          {loading ? <div className="card overflow-hidden">{[...Array(3)].map((_, i) => <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b"><div className="skeleton w-8 h-8 rounded-lg" /><div className="flex-1 space-y-1.5"><div className="skeleton h-3.5 w-32 rounded" /></div></div>)}</div>
          : coordinators.length === 0 ? <div className="empty-state"><p className="text-caption">No coordinators assigned yet</p></div>
          : <div className="card overflow-hidden">{coordinators.map((c) => <div key={c.assignmentId} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}><div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 11, background: '#0A0A0A' }}>{c.name[0]}</div><div className="flex-1 min-w-0"><p className="font-medium truncate" style={{ fontSize: 14 }}>{c.name}</p><p className="text-caption">{c.email} · {c.assignedTeamCount} teams</p></div></div>)}</div>}
        </div>
      )}
      {tab === 'activity' && (
        loading ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
        : activity.length === 0 ? <div className="empty-state"><p className="text-caption">No activity recorded yet</p></div>
        : <div className="card overflow-hidden">{activity.map((log) => <div key={log.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: 'var(--border)' }}><div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--accent)' }} /><div className="flex-1 min-w-0"><p className="font-medium" style={{ fontSize: 13 }}>{log.action}</p><p className="text-caption">{log.actor.name} · {formatDateTime(log.timestamp)}</p></div></div>)}</div>
      )}
      {tab === 'settings' && isAdmin && (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-label mb-3">Status</p>
            <div className="flex gap-2">
              {(['DRAFT', 'ACTIVE', 'ENDED'] as const).map((s) => (
                <button key={s} onClick={() => updateHackathon(hackathon.id, { status: s })} className="flex-1 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: hackathon.status === s ? '#0A0A0A' : 'var(--bg-muted)', color: hackathon.status === s ? 'white' : 'var(--text-secondary)' }}>{s}</button>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <p className="text-label mb-3">Danger zone</p>
            {!confirmDelete ? <button onClick={() => setConfirmDelete(true)} className="btn btn-danger w-full"><Trash2 className="w-3.5 h-3.5" />Delete hackathon</button>
            : <div className="p-4 rounded-lg" style={{ background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.2)' }}><p className="font-semibold mb-3" style={{ fontSize: 14, color: 'var(--danger)' }}>This cannot be undone.</p><div className="flex gap-2"><button onClick={handleDelete} className="btn btn-danger flex-1">Yes, delete everything</button><button onClick={() => setConfirmDelete(false)} className="btn btn-secondary flex-1">Cancel</button></div></div>}
          </div>
        </div>
      )}
    </div>
  );
}
