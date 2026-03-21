import { useEffect } from 'react';
import { Plus, Zap, Users, Calendar, Link2 } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn, formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function HackathonsPage() {
  const { hackathons, loading, fetchHackathons, setActiveHackathon, activeHackathon } = useHackathonStore();
  const { setCreateHackathonOpen, setInviteOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const navigate = useNavigate();
  useEffect(() => { fetchHackathons(); }, []);

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading">Hackathons</h1>
        {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setCreateHackathonOpen(true)}><Plus className="w-3.5 h-3.5" />New</button>}
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="card p-5"><div className="skeleton h-4 w-48 rounded mb-2" /><div className="skeleton h-3 w-32 rounded" /></div>)}</div>
      ) : hackathons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Zap className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></div>
          <p className="font-medium" style={{ fontSize: 14 }}>No hackathons yet</p>
          <p className="text-caption mt-1">Create your first event workspace</p>
          {isAdmin && <button className="btn btn-primary btn-sm mt-4" onClick={() => setCreateHackathonOpen(true)}><Plus className="w-3.5 h-3.5" />Create hackathon</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {hackathons.map((h) => (
            <div key={h.id} className={cn('card p-5', activeHackathon?.id === h.id && 'ring-2 ring-[#0A0A0A]')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold truncate" style={{ fontSize: 15 }}>{h.name}</p>
                    {activeHackathon?.id === h.id && <span className="px-1.5 py-0.5 rounded text-white font-semibold uppercase flex-shrink-0" style={{ fontSize: 9, letterSpacing: '0.05em', background: '#0A0A0A' }}>Active</span>}
                  </div>
                  {h.description && <p className="text-caption mt-0.5 truncate-2">{h.description}</p>}
                </div>
                <span className={cn('badge flex-shrink-0', h.status === 'ACTIVE' ? 'badge-checked_in' : h.status === 'ENDED' ? 'badge-ended' : 'badge-draft')}>{h.status}</span>
              </div>
              <div className="flex items-center gap-4 mt-3 mb-4">
                <span className="flex items-center gap-1.5 text-caption"><Calendar className="w-3.5 h-3.5" />{formatDate(h.startDate)}</span>
                <span className="flex items-center gap-1.5 text-caption"><Users className="w-3.5 h-3.5" />{h._count?.teams ?? 0} teams</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setActiveHackathon(h); navigate('/'); }} className="btn btn-secondary btn-sm flex-1">
                  {activeHackathon?.id === h.id ? 'Go to dashboard' : 'Set as active'}
                </button>
                {isAdmin && (
                  <button onClick={() => { setActiveHackathon(h); setInviteOpen(true); }} className="btn btn-ghost btn-icon btn-sm" title="Invite coordinators">
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
