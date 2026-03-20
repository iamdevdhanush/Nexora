import { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, CheckCircle2, XCircle, QrCode } from 'lucide-react';
import { useTeamsStore, Team } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { cn, formatDateTime } from '@/lib/utils';

interface ScanEntry { team: Team; success: boolean; msg: string; time: Date; }

export function CheckInPage() {
  const { teams, checkIn } = useTeamsStore();
  const { activeHackathon } = useHackathonStore();
  const { toast } = useUIStore();
  const [query, setQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState<ScanEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const matches = query.trim()
    ? teams.filter((t) =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.participants.some((p) => p.name.toLowerCase().includes(query.toLowerCase())) ||
        t.leaderPhone?.includes(query)
      ).slice(0, 5)
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
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-lg mx-auto">
      {/* Progress pill */}
      <div className="card p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm font-semibold mb-1.5">
            <span>Check-in</span>
            <span>{checkedCount}/{teams.length}</span>
          </div>
          <div className="h-2 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-ink rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="text-2xl font-bold">{pct}%</div>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-ghost" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && matches.length === 1 && doCheckIn(matches[0])}
          placeholder="Team name or member…"
          className="input pl-11 py-4 text-[16px]"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>

      {/* Suggestions */}
      {matches.length > 0 && (
        <div className="card overflow-hidden divide-y divide-line/60">
          {matches.map((team) => (
            <button
              key={team.id}
              onClick={() => doCheckIn(team)}
              disabled={processing}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left press-sm disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-full bg-ink/6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {team.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{team.name}</p>
                <p className="text-xs text-ink-ghost">{team.participants.length} members</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`badge badge-${team.status.toLowerCase()}`}>{team.status.replace('_', ' ')}</span>
                {team.status === 'REGISTERED' && (
                  <div className="w-8 h-8 bg-success-soft rounded-xl flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-success" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* QR hint */}
      <div className="flex items-center gap-3 px-4 py-3 bg-line/40 rounded-2xl">
        <QrCode className="w-5 h-5 text-ink-ghost flex-shrink-0" />
        <p className="text-xs text-ink-muted leading-relaxed">
          USB QR scanners auto-type into the search box. Press Enter to check in.
        </p>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div>
          <p className="section-label">Recent ({log.length})</p>
          <div className="card overflow-hidden divide-y divide-line/60">
            {log.map((entry, i) => (
              <div key={i} className={cn('flex items-center gap-3 px-4 py-3', i === 0 && 'bg-line/20')}>
                {entry.success
                  ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-danger flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{entry.team.name}</p>
                  <p className={cn('text-xs', entry.success ? 'text-success' : 'text-danger')}>{entry.msg}</p>
                </div>
                <span className="font-mono text-[10px] text-ink-ghost flex-shrink-0">
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
