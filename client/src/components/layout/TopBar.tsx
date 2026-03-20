import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, Zap } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn, initials } from '@/lib/utils';
import { useState } from 'react';

export function TopBar() {
  const { activeHackathon, hackathons, setActiveHackathon } = useHackathonStore();
  const { setCommandOpen, setCreateHackathonOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface-overlay backdrop-blur-xl border-b border-line/60 pt-safe">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
          {/* Logo + Hackathon switcher */}
          <button
            onClick={() => setSwitcherOpen(true)}
            className="flex items-center gap-2 press-sm min-w-0"
          >
            <div className="w-7 h-7 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm text-ink truncate max-w-[160px]">
                  {activeHackathon?.name || 'Nexora'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-ink-ghost flex-shrink-0" />
              </div>
              {activeHackathon && (
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  activeHackathon.status === 'ACTIVE' ? 'text-success' :
                  activeHackathon.status === 'ENDED' ? 'text-ink-ghost' : 'text-amber'
                )}>
                  {activeHackathon.status}
                </span>
              )}
            </div>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCommandOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-2xl text-ink-muted hover:bg-line/60 press-sm"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            {isAdmin && (
              <button
                onClick={() => setCreateHackathonOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl bg-ink text-white press-sm"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-ink/8 flex items-center justify-center text-[11px] font-bold text-ink ml-1">
              {initials(user?.name || 'U')}
            </div>
          </div>
        </div>
      </header>

      {/* Hackathon switcher sheet */}
      {switcherOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 animate-fade-in" onClick={() => setSwitcherOpen(false)} />
          <div className="fixed bottom-0 inset-x-0 z-50 bg-surface rounded-t-3xl shadow-modal animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-line rounded-full mx-auto mt-3 mb-4" />
            <div className="px-4 pb-4">
              <p className="section-label mb-3">Your Hackathons</p>
              <div className="space-y-2">
                {hackathons.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => { setActiveHackathon(h); setSwitcherOpen(false); }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all press-sm',
                      activeHackathon?.id === h.id
                        ? 'border-ink bg-ink text-white'
                        : 'border-line bg-surface-raised hover:border-line-strong'
                    )}
                  >
                    <div className="text-left">
                      <p className="font-semibold text-sm">{h.name}</p>
                      <p className={cn('text-xs mt-0.5', activeHackathon?.id === h.id ? 'text-white/60' : 'text-ink-ghost')}>
                        {h._count?.teams ?? 0} teams · {h.status}
                      </p>
                    </div>
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      h.status === 'ACTIVE'
                        ? activeHackathon?.id === h.id ? 'bg-white/20 text-white' : 'bg-success-soft text-success'
                        : activeHackathon?.id === h.id ? 'bg-white/20 text-white/80' : 'bg-line text-ink-ghost'
                    )}>
                      {h.status}
                    </span>
                  </button>
                ))}
                {isAdmin && (
                  <button
                    onClick={() => { setSwitcherOpen(false); setCreateHackathonOpen(true); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-dashed border-line text-ink-muted text-sm font-medium hover:border-ink-ghost press-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Hackathon
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
