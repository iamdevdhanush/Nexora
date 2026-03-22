import { useEffect } from 'react';
import { Plus, Zap, Users, Calendar, Link2, ArrowRight, Settings } from 'lucide-react';
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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-heading">Hackathons</h1>
          <p className="text-caption mt-0.5">{hackathons.length} event{hackathons.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-green"
            onClick={() => setCreateHackathonOpen(true)}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New hackathon
          </button>
        )}
      </div>

      {/* Admin empty-state CTA */}
      {isAdmin && hackathons.length === 0 && !loading && (
        <button
          onClick={() => setCreateHackathonOpen(true)}
          className="w-full mb-4 p-8 rounded-2xl text-center transition-all duration-200 press"
          style={{ background: 'var(--bg-card)', border: '2px dashed var(--border-strong)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--green)';
            e.currentTarget.style.background = 'rgba(0,232,122,0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            e.currentTarget.style.background = 'var(--bg-card)';
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
          >
            <Zap className="w-7 h-7" style={{ color: 'var(--green)' }} />
          </div>
          <p className="font-display font-bold mb-1" style={{ fontSize: 18, letterSpacing: '-0.02em' }}>
            Create your first hackathon
          </p>
          <p className="text-caption">Tap to set up an event workspace — teams, check-in, and more.</p>
        </button>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-48 rounded mb-3" />
              <div className="skeleton h-3 w-32 rounded mb-4" />
              <div className="skeleton h-9 w-28 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Hackathon cards */}
      {!loading && hackathons.length > 0 && (
        <div className="space-y-3">
          {hackathons.map((h) => {
            const sc = statusConfig(h.status);
            const isCurrent = activeHackathon?.id === h.id;
            return (
              <div
                key={h.id}
                className="card p-5"
                style={{
                  border: isCurrent ? '1px solid var(--green)' : '1px solid var(--border)',
                  background: isCurrent ? 'rgba(0,232,122,0.03)' : 'var(--bg-card)',
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold" style={{ fontSize: 16, letterSpacing: '-0.02em' }}>
                        {h.name}
                      </p>
                      {isCurrent && (
                        <span
                          className="px-2 py-0.5 rounded-full font-bold"
                          style={{
                            fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase',
                            background: 'var(--green-dim)', color: 'var(--green)',
                            border: '1px solid rgba(0,232,122,0.3)',
                          }}
                        >
                          CURRENT
                        </span>
                      )}
                    </div>
                    {h.description && <p className="text-caption mt-0.5 truncate-2">{h.description}</p>}
                  </div>
                  <div
                    className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-full"
                    style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: sc.color, textTransform: 'uppercase' }}>
                      {h.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <span className="flex items-center gap-1.5 text-caption">
                    <Calendar className="w-3.5 h-3.5" />{formatDate(h.startDate)}
                  </span>
                  <span className="flex items-center gap-1.5 text-caption">
                    <Users className="w-3.5 h-3.5" />{h._count?.teams ?? 0} teams
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setActiveHackathon(h); navigate('/'); }} className="btn btn-secondary btn-sm flex-1">
                    {isCurrent ? 'Open dashboard' : 'Set as active'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => navigate(`/hackathons/${h.id}`)} className="btn btn-ghost btn-sm btn-icon" title="Settings">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setActiveHackathon(h); setInviteOpen(true); }} className="btn btn-ghost btn-sm btn-icon" title="Invite">
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Always-visible create button at bottom */}
          {isAdmin && (
            <button
              onClick={() => setCreateHackathonOpen(true)}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl transition-all duration-150 press"
              style={{
                border: '1px dashed var(--border-strong)', fontSize: 14,
                fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Plus className="w-4 h-4" />
              Create another hackathon
            </button>
          )}
        </div>
      )}
    </div>
  );
}
