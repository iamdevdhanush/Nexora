import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, MessageSquare, Award, Zap, ChevronDown, Plus, LogOut, Loader2, Check, Link2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useHackathonStore, Hackathon } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { cn, initials } from '@/lib/utils';
import { useState } from 'react';
import { disconnectSocket } from '@/lib/socket';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/hackathons', label: 'Hackathons', icon: Zap },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/checkin', label: 'Check-in', icon: UserCheck },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/certificates', label: 'Certificates', icon: Award },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { hackathons, activeHackathon, setActiveHackathon, loading } = useHackathonStore();
  const { setCreateHackathonOpen, setInviteOpen } = useUIStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const handleLogout = () => { logout(); disconnectSocket(); navigate('/auth'); };

  return (
    <aside className="sidebar flex flex-col h-screen sticky top-0">
      <div className="px-3 pt-4 pb-2">
        <button onClick={() => setSwitcherOpen((v) => !v)} className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-100', switcherOpen ? 'bg-[var(--bg-muted)]' : 'hover:bg-[var(--bg-muted)]')}>
          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: '#0A0A0A' }}><Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} /></div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-semibold truncate" style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.3 }}>{activeHackathon?.name || 'Nexora'}</p>
            {activeHackathon && <p className="uppercase font-semibold" style={{ fontSize: 10, letterSpacing: '0.05em', color: activeHackathon.status === 'ACTIVE' ? 'var(--success)' : activeHackathon.status === 'ENDED' ? 'var(--text-disabled)' : 'var(--warning)' }}>{activeHackathon.status}</p>}
          </div>
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200" style={{ color: 'var(--text-muted)', transform: switcherOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>
        {switcherOpen && (
          <div className="mt-1 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)', background: 'var(--bg)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div className="py-1 max-h-48 overflow-y-auto">
              {loading ? <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
              : hackathons.length === 0 ? <p className="text-center py-4 text-caption">No hackathons</p>
              : hackathons.map((h) => (
                <button key={h.id} onClick={() => { setActiveHackathon(h); setSwitcherOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors duration-100 text-left" style={{ fontSize: 13 }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-white font-bold" style={{ fontSize: 9, background: '#0A0A0A' }}>{h.name[0]}</div>
                  <span className="flex-1 truncate font-medium" style={{ color: 'var(--text)' }}>{h.name}</span>
                  {activeHackathon?.id === h.id && <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
            {isAdmin && (
              <>
                <div className="divider" />
                {activeHackathon && <button onClick={() => { setSwitcherOpen(false); setInviteOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors duration-100" style={{ fontSize: 13, color: 'var(--text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}><Link2 className="w-3.5 h-3.5" />Invite coordinators</button>}
                <button onClick={() => { setSwitcherOpen(false); setCreateHackathonOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors duration-100" style={{ fontSize: 13, color: 'var(--text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}><Plus className="w-3.5 h-3.5" />New hackathon</button>
              </>
            )}
          </div>
        )}
      </div>
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-label px-2.5 mb-2 mt-2">Navigation</p>
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink key={to} to={to} end={exact} className={({ isActive }) => cn('nav-item', isActive && 'active')}>
            <Icon className="w-4 h-4 flex-shrink-0" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 10, background: '#0A0A0A' }}>{initials(user?.name || 'U')}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate" style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.3 }}>{user?.name || 'User'}</p>
            <p className="truncate" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role === 'SUPER_ADMIN' ? 'Super Coordinator' : 'Coordinator'}</p>
          </div>
          <button onClick={handleLogout} className="w-6 h-6 rounded flex items-center justify-center transition-colors duration-100" style={{ color: 'var(--text-muted)' }} title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
