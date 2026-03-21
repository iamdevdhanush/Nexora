import { useEffect, useState } from 'react';
import { ArrowUpRight, Users, UserCheck, Send, Table2, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHackathonStore } from '@/store/hackathonStore';
import { useTeamsStore } from '@/store/teamsStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { cn, formatDate, formatDateTime, pluralize } from '@/lib/utils';

interface Metrics {
  totalTeams: number; checkedIn: number; checkedInPercent: number;
  active: number; submitted: number; missing: number;
  totalParticipants: number; messagesToday: number;
}

export function DashboardPage() {
  const { activeHackathon } = useHackathonStore();
  const { teams } = useTeamsStore();
  const { setBroadcastOpen, setSheetsOpen } = useUIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    if (!activeHackathon) return;
    setMetricsLoading(true);
    api.get<Metrics>(`/hackathons/${activeHackathon.id}/metrics`)
      .then(setMetrics).catch(() => {}).finally(() => setMetricsLoading(false));
    const socket = getSocket();
    const handler = ({ payload }: any) => setMetrics(payload);
    socket.on('metrics:updated', handler);
    return () => { socket.off('metrics:updated', handler); };
  }, [activeHackathon?.id]);

  const recentCheckins = [...teams]
    .filter((t) => t.checkInTime)
    .sort((a, b) => new Date(b.checkInTime!).getTime() - new Date(a.checkInTime!).getTime())
    .slice(0, 8);

  if (!activeHackathon) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-24 px-6">
        <div className="empty-icon"><Zap className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></div>
        <h2 className="font-semibold mb-1" style={{ fontSize: 16 }}>No hackathon selected</h2>
        <p className="text-caption text-center mb-6">Create your first event to get started</p>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => useUIStore.getState().setCreateHackathonOpen(true)}>
            Create hackathon
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-heading">{activeHackathon.name}</h1>
          <p className="text-caption mt-1">{formatDate(activeHackathon.startDate)} · {activeHackathon.venue || 'Online'}</p>
        </div>
        <span className={cn('badge mt-1',
          activeHackathon.status === 'ACTIVE' ? 'badge-checked_in' :
          activeHackathon.status === 'ENDED' ? 'badge-ended' : 'badge-draft')}>
          {activeHackathon.status}
        </span>
      </div>

      {metricsLoading ? (
        <div className="card p-5 mb-5">
          <div className="skeleton h-4 w-32 mb-4 rounded" />
          <div className="progress-bar mb-4"><div className="progress-fill" style={{ width: '0%' }} /></div>
          <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}</div>
        </div>
      ) : metrics ? (
        <div className="card p-5 mb-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold" style={{ fontSize: 14 }}>Check-in progress</p>
            <span className="font-bold" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{metrics.checkedInPercent}%</span>
          </div>
          <p className="text-caption mb-3">{metrics.checkedIn} of {metrics.totalTeams} teams checked in</p>
          <div className="progress-bar mb-5"><div className="progress-fill" style={{ width: `${metrics.checkedInPercent}%` }} /></div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: metrics.totalTeams, color: 'var(--text)' },
              { label: 'Checked in', value: metrics.checkedIn, color: 'var(--success)' },
              { label: 'Active', value: metrics.active, color: 'var(--warning)' },
              { label: 'Submitted', value: metrics.submitted, color: 'var(--blue)' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-bold" style={{ fontSize: 20, color: s.color }}>{s.value}</p>
                <p className="text-caption" style={{ marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button onClick={() => navigate('/checkin')} className="card-hover p-4 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--success-bg)' }}>
            <UserCheck className="w-4 h-4" style={{ color: 'var(--success)' }} />
          </div>
          <p className="font-semibold" style={{ fontSize: 14 }}>Check-in</p>
          <p className="text-caption mt-0.5">{metrics?.missing ?? '–'} waiting</p>
        </button>
        <button onClick={() => navigate('/teams')} className="card-hover p-4 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--blue-bg)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--blue)' }} />
          </div>
          <p className="font-semibold" style={{ fontSize: 14 }}>Teams</p>
          <p className="text-caption mt-0.5">{metrics?.totalTeams ?? '–'} registered</p>
        </button>
        {isAdmin && (
          <>
            <button onClick={() => setBroadcastOpen(true)} className="card-hover p-4 text-left">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--bg-muted)' }}>
                <Send className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </div>
              <p className="font-semibold" style={{ fontSize: 14 }}>Broadcast</p>
              <p className="text-caption mt-0.5">Message all teams</p>
            </button>
            <button onClick={() => setSheetsOpen(true)} className="card-hover p-4 text-left">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--success-bg)' }}>
                <Table2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
              </div>
              <p className="font-semibold" style={{ fontSize: 14 }}>Import teams</p>
              <p className="text-caption mt-0.5">Sync from Sheets</p>
            </button>
          </>
        )}
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="metric-card">
            <p className="text-label mb-3">Participants</p>
            <p className="font-bold" style={{ fontSize: 28, lineHeight: 1 }}>{metrics.totalParticipants}</p>
            <p className="text-caption mt-1.5">Total across all teams</p>
          </div>
          <div className="metric-card">
            <p className="text-label mb-3">Messages today</p>
            <p className="font-bold" style={{ fontSize: 28, lineHeight: 1 }}>{metrics.messagesToday}</p>
            <p className="text-caption mt-1.5">Broadcasts sent</p>
          </div>
        </div>
      )}

      {recentCheckins.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-label flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Recent check-ins</p>
            <button onClick={() => navigate('/teams')} className="flex items-center gap-0.5 text-caption font-medium" style={{ color: 'var(--text-secondary)' }}>
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="card overflow-hidden">
            {recentCheckins.map((team) => (
              <div key={team.id} className="table-row" onClick={() => navigate('/teams')}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 11, background: '#0A0A0A' }}>
                  {team.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ fontSize: 14 }}>{team.name}</p>
                  <p className="text-caption">{pluralize(team.participants.length, 'member')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('badge', `badge-${team.status.toLowerCase()}`)}>{team.status.replace('_', ' ')}</span>
                  {team.checkInTime && (
                    <span className="text-caption font-mono">{new Date(team.checkInTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
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
