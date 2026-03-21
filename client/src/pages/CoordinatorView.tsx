import { useEffect, useState } from 'react';
import { Phone, MessageSquare, UserCheck, RefreshCw, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTeamsStore, Team } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { disconnectSocket } from '@/lib/socket';
import { useNavigate } from 'react-router-dom';
import { initials, pluralize } from '@/lib/utils';

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
    <div className="min-h-screen" style={{ background: 'var(--bg-subtle)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-4 pt-safe"
        style={{ background: '#0A0A0A' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-white font-bold" style={{ fontSize: 14 }}>Nexora</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Coordinator · {user?.name}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <LogOut className="w-4 h-4 text-white/60" />
        </button>
      </header>

      {activeHackathon && (
        <div className="px-4 pb-3 pt-3" style={{ background: '#0A0A0A' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Event</p>
          <p className="text-white font-bold" style={{ fontSize: 18 }}>{activeHackathon.name}</p>
        </div>
      )}

      {/* Teams */}
      <div className="px-4 pt-4 pb-24 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-label">My Teams ({teams.length})</p>
          <button
            onClick={() => activeHackathon && fetchTeams(activeHackathon.id)}
            className="btn btn-ghost btn-icon btn-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {teams.map((team) => (
          <div key={team.id} className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ fontSize: 14, background: '#0A0A0A' }}
              >
                {initials(team.name)}
              </div>
              <div className="flex-1">
                <p className="font-bold" style={{ fontSize: 16 }}>{team.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`badge badge-${team.status.toLowerCase()}`}>
                    {team.status.replace('_', ' ')}
                  </span>
                  {team.room && <span className="text-caption font-mono">{team.room}</span>}
                </div>
              </div>
            </div>

            {team.leaderPhone && (
              <p className="font-mono text-caption">{team.leaderPhone}</p>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
              {team.status === 'REGISTERED' && (
                <button
                  onClick={() => handleCheckIn(team)}
                  disabled={checking === team.id}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-colors duration-100 disabled:opacity-50"
                  style={{ background: 'var(--success-bg)' }}
                >
                  {checking === team.id ? (
                    <div className="spinner" style={{ width: 20, height: 20, borderTopColor: 'var(--success)' }} />
                  ) : (
                    <UserCheck className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)' }}>Check In</span>
                </button>
              )}
              {team.leaderPhone && (
                <>
                  <a
                    href={`tel:${team.leaderPhone}`}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-colors duration-100"
                    style={{ background: 'var(--bg-muted)' }}
                  >
                    <Phone className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/${team.leaderPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener"
                    className="flex flex-col items-center gap-1.5 py-3 rounded-lg transition-colors duration-100"
                    style={{ background: 'rgba(37,211,102,0.1)' }}
                  >
                    <MessageSquare className="w-5 h-5" style={{ color: '#128C3E' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#128C3E' }}>WhatsApp</span>
                  </a>
                </>
              )}
            </div>

            {/* Members */}
            {team.participants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                {team.participants.map((p) => (
                  <span
                    key={p.id}
                    className="px-2 py-0.5 rounded-full font-medium"
                    style={{
                      fontSize: 11,
                      background: p.isLeader ? '#0A0A0A' : 'var(--bg-muted)',
                      color: p.isLeader ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {teams.length === 0 && (
          <div className="empty-state">
            <p className="text-caption">No teams assigned to you yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
