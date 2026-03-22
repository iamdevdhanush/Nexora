import { useEffect } from 'react';
import { Plus, Zap, Users, Calendar, Link2, ArrowRight } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn, formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function HackathonsPage() {
  const { hackathons, loading, fetchHackathons, setActiveHackathon, activeHackathon } =
    useHackathonStore();
  const { setCreateHackathonOpen, setInviteOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const navigate = useNavigate();

  useEffect(() => { fetchHackathons(); }, []);

  const statusConfig = (status: string) => {
    if (status === 'ACTIVE')
      return { color: 'var(--green)', bg: 'var(--green-dim)', border: 'rgba(0,232,122,0.25)' };
    if (status === 'ENDED')
      return { color: 'var(--text-disabled)', bg: 'var(--bg-muted)', border: 'var(--border)' };
    return { color: 'var(--yellow)', bg: 'var(--yellow-dim)', border: 'rgba(251,191,36,0.25)' };
  };

  return (
    <div className="max-w-2xl mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-heading">Hackathons</h1>
          <p className="text-caption mt-0.5">{hackathons.length} total</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setCreateHackathonOpen(true)}>
            <Plus className="w-3.5 h-3.5" />
            New event
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-48 rounded mb-3" />
              <div className="skeleton h-3 w-32 rounded mb-4" />
              <div className="skeleton h-8 w-28 rounded-xl" />
            </div>
          ))}
        </div>
      ) : hackathons.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Zap className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-title mb-2">No hackathons yet</p>
          <p className="text-caption mb-6">Create your first event workspace</p>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => setCreateHackathonOpen(true)}>
              <Plus className="w-3.5 h-3.5" />
              Create hackathon
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {hackathons.map((h) => {
            const sc = statusConfig(h.status);
            const isActive = activeHackathon?.id === h.id;
            return (
              <div
                key={h.id}
                className="card p-5"
                style={{ border: isActive ? '1px solid var(--border-accent)' : '1px solid var(--border)' }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p
                        className="font-display font-bold truncate"
                        style={{ fontSize: 16, letterSpacing: '-0.02em' }}
                      >
                        {h.name}
                      </p>
                      {isActive && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            fontSize: 9,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                            background: 'var(--text)',
                            color: 'var(--bg)',
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    {h.description && (
                      <p className="text-caption truncate-2">{h.description}</p>
                    )}
                  </div>
                  <div
                    className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full"
                    style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: sc.color }}
                    />
                    <span
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: sc.color, textTransform: 'uppercase' }}
                    >
                      {h.status}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="flex items-center gap-1.5 text-caption">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(h.startDate)}
                  </span>
                  <span className="flex items-center gap-1.5 text-caption">
                    <Users className="w-3.5 h-3.5" /> {h._count?.teams ?? 0} teams
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setActiveHackathon(h); navigate('/'); }}
                    className="btn btn-secondary btn-sm flex-1"
                  >
                    {isActive ? 'Open dashboard' : 'Set as active'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => navigate(`/hackathons/${h.id}`)}
                        className="btn btn-ghost btn-sm"
                        title="Manage"
                      >
                        Manage
                      </button>
                      <button
                        onClick={() => { setActiveHackathon(h); setInviteOpen(true); }}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Invite coordinators"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
