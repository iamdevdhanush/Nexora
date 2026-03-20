import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LayoutDashboard, Users, MessageSquare, Award, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { useUIStore } from '@/store/uiStore';
import { joinHackathon, leaveHackathon, getSocket, disconnectSocket } from '@/lib/socket';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { BroadcastSheet } from '@/components/broadcast/BroadcastSheet';
import { SheetsSheet } from '@/components/teams/SheetsSheet';
import { CreateHackathonSheet } from '@/components/hackathons/CreateHackathonSheet';
import { TopBar } from './TopBar';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard, exact: true },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/messages', label: 'Msgs', icon: MessageSquare },
  { to: '/certificates', label: 'Certs', icon: Award },
];

export function AppShell() {
  const { activeHackathon, fetchHackathons } = useHackathonStore();
  const { fetchTeams, upsertTeam } = useTeamsStore();
  const { broadcastOpen, sheetsOpen, createHackathonOpen, commandOpen } = useUIStore();
  const { user } = useAuthStore();

  // Fetch on mount
  useEffect(() => {
    fetchHackathons();
  }, []);

  // Join hackathon room when activeHackathon changes
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

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().setCommandOpen(true);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) {
        e.preventDefault();
        useUIStore.getState().setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopBar />

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-safe">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface-overlay backdrop-blur-xl border-t border-line/60 bottom-nav shadow-bottom-nav">
        <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-150 min-w-[64px]',
                  isActive
                    ? 'text-ink'
                    : 'text-ink-ghost hover:text-ink-muted'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    'w-10 h-7 flex items-center justify-center rounded-xl transition-all duration-150',
                    isActive ? 'bg-ink/8' : ''
                  )}>
                    <Icon className={cn('w-5 h-5 transition-all', isActive ? 'stroke-[2.5]' : 'stroke-[1.5]')} />
                  </div>
                  <span className={cn('text-[10px] font-semibold tracking-wide transition-all', isActive ? 'text-ink' : 'text-ink-ghost')}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Overlays */}
      {commandOpen && <CommandPalette />}
      {broadcastOpen && <BroadcastSheet />}
      {sheetsOpen && <SheetsSheet />}
      {createHackathonOpen && <CreateHackathonSheet />}
    </div>
  );
}
