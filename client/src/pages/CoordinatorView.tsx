import { useEffect, useState } from 'react';
import { Phone, MessageSquare, UserCheck, RefreshCw, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTeamsStore, Team } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { disconnectSocket } from '@/lib/socket';
import { useNavigate } from 'react-router-dom';
import { cn, initials, pluralize } from '@/lib/utils';

export function CoordinatorView() {
  const { user, logout } = useAuthStore();
  const { teams, fetchTeams, checkIn } = useTeamsStore();
  const { activeHackathon, fetchHackathons } = useHackathonStore();
  const { toast } = useUIStore();
  const navigate = useNavigate();
  const [checking, setChecking] = useState<string | null>(null);

  useEffect(() => {
    fetchHackathons().then(() => {
      if (activeHackathon) fetchTeams(activeHackathon.id);
    });
  }, []);

  const handleCheckIn = async (team: Team) => {
    if (!activeHackathon) return;
    setChecking(team.id);
    try {
      await checkIn(activeHackathon.id, team.id);
      toast(`${team.name} checked in ✓`, 'success');
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setChecking(null); }
  };

  const handleLogout = () => { logout(); disconnectSocket(); navigate('/auth'); };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-ink px-4 py-4 pt-safe flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Nexora</p>
            <p className="text-white/40 text-[10px]">Coordinator · {user?.name}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
          <LogOut className="w-4 h-4 text-white/60" />
        </button>
      </header>

      {/* Event info */}
      {activeHackathon && (
        <div className="bg-ink px-4 pb-4">
          <p className="text-white/50 text-xs">Event</p>
          <p className="text-white font-bold text-lg">{activeHackathon.name}</p>
        </div>
      )}

      {/* Teams list */}
      <div className="px-4 pt-4 pb-24 space-y-3">
        <div className="flex items-center justify-between">
          <p className="section-label">My Teams ({teams.length})</p>
          <button
            onClick={() => activeHackathon && fetchTeams(activeHackathon.id)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-line/60"
          >
            <RefreshCw className="w-3.5 h-3.5 text-ink-muted" />
          </button>
        </div>

        {teams.map((team) => (
          <div key={team.id} className="card p-4 space-y-3">
            {/* Team info */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-ink/6 flex items-center justify-center text-base font-bold">
                {initials(team.name)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">{team.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`badge badge-${team.status.toLowerCase()}`}>{team.status.replace('_', ' ')}</span>
                  {team.room && <span className="text-xs text-ink-ghost font-mono">{team.room}</span>}
                </div>
              </div>
            </div>

            {/* Leader contact */}
            {team.leaderPhone && (
              <p className="text-sm text-ink-muted font-mono">{team.leaderPhone}</p>
            )}

            {/* Action buttons - large for thumb use */}
            <div className="grid grid-cols-3 gap-2">
              {team.status === 'REGISTERED' && (
                <button
                  onClick={() => handleCheckIn(team)}
                  disabled={checking === team.id}
                  className="flex flex-col items-center gap-1 py-3 bg-success-soft rounded-2xl press-sm disabled:opacity-50"
                >
                  {checking === team.id
                    ? <div className="w-5 h-5 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                    : <UserCheck className="w-5 h-5 text-success" />}
                  <span className="text-[11px] font-semibold text-success">Check In</span>
                </button>
              )}
              {team.leaderPhone && (
                <>
                  <a
                    href={`tel:${team.leaderPhone}`}
                    className="flex flex-col items-center gap-1 py-3 bg-line/60 rounded-2xl press-sm"
                  >
                    <Phone className="w-5 h-5 text-ink-muted" />
                    <span className="text-[11px] font-semibold text-ink-muted">Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${team.leaderPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener"
                    className="flex flex-col items-center gap-1 py-3 bg-[#25D366]/10 rounded-2xl press-sm"
                  >
                    <MessageSquare className="w-5 h-5 text-[#128C3E]" />
                    <span className="text-[11px] font-semibold text-[#128C3E]">WhatsApp</span>
                  </a>
                </>
              )}
            </div>

            {/* Members compact */}
            {team.participants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-line/60">
                {team.participants.map((p) => (
                  <span key={p.id} className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full font-medium',
                    p.isLeader ? 'bg-ink text-white' : 'bg-line text-ink-muted'
                  )}>
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {teams.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-ink-ghost">
            <p className="text-sm">No teams assigned to you yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
