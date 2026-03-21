import { Search, Plus, ChevronDown, Zap } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn, initials } from '@/lib/utils';
import { useState } from 'react';

export function TopBar() {
  const { activeHackathon, hackathons, setActiveHackathon, loading } = useHackathonStore();
  const { setCommandOpen, setCreateHackathonOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 pt-safe"
        style={{
          height: 52,
          background: 'rgba(255,255,255,0.9)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Brand + switcher */}
        <button
          onClick={() => setSwitcherOpen(true)}
          className="flex items-center gap-2 press min-w-0"
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: '#0A0A0A' }}
          >
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-semibold truncate" style={{ fontSize: 14, color: 'var(--text)', maxWidth: 140 }}>
              {activeHackathon?.name || 'Nexora'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCommandOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-100"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Search className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={() => setCreateHackathonOpen(true)}
              className="btn btn-primary btn-icon btn-sm ml-1"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold ml-1 flex-shrink-0"
            style={{ fontSize: 10, background: '#0A0A0A' }}
          >
            {initials(user?.name || 'U')}
          </div>
        </div>
      </header>

      {/* Hackathon switcher sheet */}
      {switcherOpen && (
        <>
          <div className="overlay animate-fade-in" onClick={() => setSwitcherOpen(false)} />
          <div
            className="sheet animate-slide-up flex flex-col"
            style={{ maxHeight: '65vh' }}
          >
            <div className="sheet-handle" />
            <div className="px-4 pb-2">
              <p className="text-label mb-3">Switch hackathon</p>
              <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 260 }}>
                {hackathons.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => { setActiveHackathon(h); setSwitcherOpen(false); }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors duration-100 text-left',
                      activeHackathon?.id === h.id
                        ? 'bg-[#0A0A0A]'
                        : 'hover:bg-[var(--bg-subtle)]'
                    )}
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div>
                      <p
                        className="font-semibold"
                        style={{ fontSize: 14, color: activeHackathon?.id === h.id ? 'white' : 'var(--text)' }}
                      >
                        {h.name}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: activeHackathon?.id === h.id ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)',
                          marginTop: 1,
                        }}
                      >
                        {h._count?.teams ?? 0} teams · {h.status}
                      </p>
                    </div>
                    {activeHackathon?.id === h.id && (
                      <div
                        className="px-2 py-0.5 rounded-full font-semibold uppercase"
                        style={{ fontSize: 10, letterSpacing: '0.05em', background: 'rgba(255,255,255,0.15)', color: 'white' }}
                      >
                        Active
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {isAdmin && (
                <button
                  onClick={() => { setSwitcherOpen(false); setCreateHackathonOpen(true); }}
                  className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-lg transition-colors duration-100"
                  style={{
                    border: '1px dashed var(--border)',
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New hackathon
                </button>
              )}
              <div style={{ height: 'var(--safe-bottom)', paddingBottom: 12 }} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
