import { useEffect, useState } from 'react';
import { ArrowUpRight, Users, UserCheck, Zap, Trophy, MessageSquare, Send, Table2, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { cn, formatDate, pluralize } from '@/lib/utils';

interface Metrics {
  totalTeams: number;
  checkedIn: number;
  checkedInPercent: number;
  active: number;
  submitted: number;
  missing: number;
  totalParticipants: number;
  messagesToday: number;
}

export function DashboardPage() {
  const { activeHackathon } = useHackathonStore();
  const { teams } = useTeamsStore();
  const { setBroadcastOpen, setSheetsOpen, toast } = useUIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const isAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!activeHackathon) return;
    api.get<Metrics>(`/hackathons/${activeHackathon.id}/metrics`).then(setMetrics).catch(() => {});
    const socket = getSocket();
    const handler = ({ payload }: any) => setMetrics(payload);
    socket.on('metrics:updated', handler);
    return () => { socket.off('metrics:updated', handler); };
  }, [activeHackathon?.id]);

  const recentCheckins = [...teams]
    .filter((t) => t.checkInTime)
    .sort((a, b) => new Date(b.checkInTime!).getTime() - new Date(a.checkInTime!).getTime())
    .slice(0, 5);

  if (!activeHackathon) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-8 text-center">
        <div className="w-16 h-16 bg-ink/5 rounded-3xl flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-ink-ghost" />
        </div>
        <h2 className="text-xl font-bold mb-2">No hackathon selected</h2>
        <p className="text-ink-muted text-sm mb-6">Create your first hackathon to get started</p>
        {isAdmin && (
          <button onClick={() => useUIStore.getState().setCreateHackathonOpen(true)} className="btn-primary">
            Create Hackathon
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 space-y-5 max-w-2xl mx-auto">
      {/* Event header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{activeHackathon.name}</h1>
          <p className="text-ink-ghost text-sm mt-0.5">
            {formatDate(activeHackathon.startDate)} · {activeHackathon.venue || 'Online'}
          </p>
        </div>
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-1',
          activeHackathon.status === 'ACTIVE' ? 'bg-success-soft text-success' :
          activeHackathon.status === 'ENDED' ? 'bg-line text-ink-ghost' : 'bg-amber-soft text-amber'
        )}>
          {activeHackathon.status}
        </span>
      </div>

      {/* Checkin progress bar */}
      {metrics && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">Check-in Progress</p>
            <span className="text-2xl font-bold text-ink">{metrics.checkedInPercent}%</span>
          </div>
          <div className="h-2 bg-line rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-ink rounded-full transition-all duration-700"
              style={{ width: `${metrics.checkedInPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total', value: metrics.totalTeams, color: 'text-ink' },
              { label: 'In', value: metrics.checkedIn, color: 'text-success' },
              { label: 'Active', value: metrics.active, color: 'text-amber' },
              { label: 'Done', value: metrics.submitted, color: 'text-brand' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                <p className="text-[11px] text-ink-ghost font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/checkin')}
          className="flex items-center gap-3 p-4 card press-sm text-left"
        >
          <div className="w-10 h-10 bg-success-soft rounded-2xl flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-semibold text-sm">Check In</p>
            <p className="text-xs text-ink-ghost">{metrics?.missing ?? '–'} waiting</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/teams')}
          className="flex items-center gap-3 p-4 card press-sm text-left"
        >
          <div className="w-10 h-10 bg-brand-soft rounded-2xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="font-semibold text-sm">Teams</p>
            <p className="text-xs text-ink-ghost">{metrics?.totalTeams ?? '–'} total</p>
          </div>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setBroadcastOpen(true)}
              className="flex items-center gap-3 p-4 card press-sm text-left"
            >
              <div className="w-10 h-10 bg-ink/6 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-ink" />
              </div>
              <div>
                <p className="font-semibold text-sm">Broadcast</p>
                <p className="text-xs text-ink-ghost">Message teams</p>
              </div>
            </button>

            <button
              onClick={() => setSheetsOpen(true)}
              className="flex items-center gap-3 p-4 card press-sm text-left"
            >
              <div className="w-10 h-10 bg-success-soft rounded-2xl flex items-center justify-center flex-shrink-0">
                <Table2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-sm">Sync Sheet</p>
                <p className="text-xs text-ink-ghost">Import teams</p>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Recent check-ins */}
      {recentCheckins.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Recent Check-ins</p>
            <button onClick={() => navigate('/teams')} className="text-xs text-brand font-semibold flex items-center gap-0.5">
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="card overflow-hidden divide-y divide-line/60">
            {recentCheckins.map((team) => (
              <div key={team.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-full bg-ink/6 flex items-center justify-center text-xs font-bold text-ink flex-shrink-0">
                  {team.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{team.name}</p>
                  <p className="text-xs text-ink-ghost">{pluralize(team.participants.length, 'member')}</p>
                </div>
                <div className="text-right">
                  <span className={`badge badge-${team.status.toLowerCase()}`}>{team.status.replace('_', ' ')}</span>
                  {team.checkInTime && (
                    <p className="text-[10px] text-ink-ghost mt-0.5 font-mono">
                      {new Date(team.checkInTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
