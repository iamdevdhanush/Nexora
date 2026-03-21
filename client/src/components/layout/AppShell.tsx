import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { LayoutDashboard, Users, UserCheck, MessageSquare, Award } from 'lucide-react';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { useUIStore } from '@/store/uiStore';
import { joinHackathon, leaveHackathon, getSocket } from '@/lib/socket';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { BroadcastSheet } from '@/components/broadcast/BroadcastSheet';
import { SheetsSheet } from '@/components/teams/SheetsSheet';
import { CreateHackathonSheet } from '@/components/hackathons/CreateHackathonSheet';
import { Toasts } from '@/components/ui/Toasts';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const BOTTOM_NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard, exact: true },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/checkin', label: 'Check-in', icon: UserCheck },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/certificates', label: 'Certs', icon: Award },
];

export function AppShell() {
  const { activeHackathon, fetchHackathons } = useHackathonStore();
  const { fetchTeams, upsertTeam } = useTeamsStore();
  const { broadcastOpen, sheetsOpen, createHackathonOpen, commandOpen } = useUIStore();

  useEffect(() => { fetchHackathons(); }, []);

  useEffect(() => {
    if (!activeHackathon) return;
    fetchTeams(activeHackathon.id);
    const socket = getSocket();
    joinHackathon(activeHackathon.id);
    const onTeamUpdated = ({ payload }: any) => upsertTeam(payload);
    const onTeamCheckin = ({ payload }: any) => upsertTeam(payload.team);
    socket.on('team:updated', onTeamUpdated);
    socket.on('team:checkin', onTeamCheckin);
    return () => {
      leaveHackathon(activeHackathon.id);
      socket.off('team:updated', onTeamUpdated);
      socket.off('team:checkin', onTeamCheckin);
    };
  }, [activeHackathon?.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); useUIStore.getState().setCommandOpen(true); }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) {
        e.preventDefault(); useUIStore.getState().setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="ambient-bg">
      {/* Desktop */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
        <Sidebar />
        <main className="min-h-screen overflow-auto" style={{ borderLeft: '1px solid var(--border)' }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile */}
      <div className="md:hidden min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto pb-nav"><Outlet /></main>
        <nav className="fixed bottom-0 inset-x-0 z-30 flex items-center"
          style={{ height: 'calc(52px + var(--safe-bottom))', paddingBottom: 'var(--safe-bottom)', background: 'rgba(255,255,255,0.9)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          {BOTTOM_NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-100">
              {({ isActive }) => (
                <>
                  <div className="w-9 h-6 flex items-center justify-center rounded-lg transition-colors duration-100" style={{ background: isActive ? 'var(--bg-muted)' : 'transparent' }}>
                    <Icon style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)', strokeWidth: isActive ? 2.5 : 1.75, width: 18, height: 18 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--text)' : 'var(--text-muted)', letterSpacing: '0.02em' }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {commandOpen && <CommandPalette />}
      {broadcastOpen && <BroadcastSheet />}
      {sheetsOpen && <SheetsSheet />}
      {createHackathonOpen && <CreateHackathonSheet />}
      <Toasts />
    </div>
  );
}
