import { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, CheckCircle2, XCircle, QrCode, ScanLine } from 'lucide-react';
import { useTeamsStore, Team } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface LogEntry { team: Team; success: boolean; msg: string; time: Date; }

export function CheckInPage() {
  const { teams, checkIn } = useTeamsStore();
  const { activeHackathon } = useHackathonStore();
  const { toast } = useUIStore();
  const [query, setQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const matches = query.trim()
    ? teams.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.participants.some((p) => p.name.toLowerCase().includes(query.toLowerCase())) ||
        t.leaderPhone?.includes(query)
      ).slice(0, 6)
    : [];

  const doCheckIn = async (team: Team) => {
    if (!activeHackathon || processing) return;
    if (team.status !== 'REGISTERED') {
      setLog((l) => [{ team, success: false, msg: `Already ${team.status.replace('_', ' ')}`, time: new Date() }, ...l].slice(0, 20));
      setQuery('');
      return;
    }
    setProcessing(true);
    try {
      await checkIn(activeHackathon.id, team.id);
      setLog((l) => [{ team: { ...team, status: 'CHECKED_IN' }, success: true, msg: 'Checked in', time: new Date() }, ...l].slice(0, 20));
      toast(`✓ ${team.name}`, 'success');
    } catch (e: any) {
      setLog((l) => [{ team, success: false, msg: e.message, time: new Date() }, ...l].slice(0, 20));
      toast(e.message, 'error');
    } finally {
      setProcessing(false);
      setQuery('');
      inputRef.current?.focus();
    }
  };

  const checkedCount = teams.filter((t) => ['CHECKED_IN', 'ACTIVE', 'SUBMITTED'].includes(t.status)).length;
  const pct = teams.length ? Math.round((checkedCount / teams.length) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading">Check-in</h1>
        <div className="flex items-center gap-1.5">
          <ScanLine className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-caption">QR mode</span>
        </div>
      </div>

      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold" style={{ fontSize: 14 }}>Progress</p>
          <span className="font-bold" style={{ fontSize: 22 }}>{pct}%</span>
        </div>
        <p className="text-caption mb-3">{checkedCount} of {teams.length} teams</p>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-disabled)' }} />
        <input ref={inputRef} type="search" value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && matches.length === 1 && doCheckIn(matches[0])}
          placeholder="Team name, member, or phone…"
          className="input pl-10" style={{ height: 44, fontSize: 15 }}
          autoComplete="off" autoCorrect="off" />
      </div>

      {matches.length > 0 && (
        <div className="card overflow-hidden mb-4">
          {matches.map((team) => (
            <button key={team.id} onClick={() => doCheckIn(team)} disabled={processing} className="table-row w-full text-left disabled:opacity-50">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 10, background: '#0A0A0A' }}>
                {team.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ fontSize: 14 }}>{team.name}</p>
                <p className="text-caption">{team.participants.length} members</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn('badge', `badge-${team.status.toLowerCase()}`)}>{team.status.replace('_', ' ')}</span>
                {team.status === 'REGISTERED' && (
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--success-bg)' }}>
                    <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 rounded-lg mb-5" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
        <QrCode className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        <p className="text-caption">USB QR scanners auto-type into the search box. Single match + Enter = instant check-in.</p>
      </div>

      {log.length > 0 && (
        <div>
          <p className="text-label mb-2">Recent activity</p>
          <div className="card overflow-hidden">
            {log.slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                style={{ borderColor: 'var(--border)', background: i === 0 ? 'var(--bg-subtle)' : 'transparent' }}>
                {entry.success
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
                  : <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--danger)' }} />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ fontSize: 14 }}>{entry.team.name}</p>
                  <p style={{ fontSize: 12, color: entry.success ? 'var(--success)' : 'var(--danger)' }}>{entry.msg}</p>
                </div>
                <span className="font-mono text-caption flex-shrink-0">
                  {entry.time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
