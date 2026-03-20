import { useEffect } from 'react';
import { Plus, Zap, Users, Calendar } from 'lucide-react';
import { useHackathonStore, Hackathon } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn, formatDate } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: 'bg-success-soft text-success',
  DRAFT: 'bg-amber-soft text-amber',
  ENDED: 'bg-line text-ink-ghost',
};

export function HackathonsPage() {
  const { hackathons, loading, fetchHackathons, setActiveHackathon, activeHackathon } = useHackathonStore();
  const { setCreateHackathonOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => { fetchHackathons(); }, []);

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Hackathons</h1>
        {isAdmin && (
          <button onClick={() => setCreateHackathonOpen(true)} className="btn-primary py-2 px-4 text-sm">
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>
      ) : hackathons.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-ink-ghost">
          <Zap className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-semibold mb-1">No hackathons yet</p>
          {isAdmin && <button onClick={() => setCreateHackathonOpen(true)} className="text-brand text-sm font-semibold mt-2">Create your first →</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {hackathons.map((h) => (
            <button
              key={h.id}
              onClick={() => setActiveHackathon(h)}
              className={cn(
                'w-full text-left card p-4 press-sm transition-all',
                activeHackathon?.id === h.id && 'ring-2 ring-ink'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base truncate">{h.name}</p>
                    {activeHackathon?.id === h.id && (
                      <span className="text-[9px] bg-ink text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide flex-shrink-0">Active</span>
                    )}
                  </div>
                  {h.description && <p className="text-sm text-ink-muted mt-0.5 line-clamp-2">{h.description}</p>}
                </div>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0', STATUS_STYLE[h.status])}>
                  {h.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-ink-ghost">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(h.startDate)}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{h._count?.teams ?? 0} teams</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
