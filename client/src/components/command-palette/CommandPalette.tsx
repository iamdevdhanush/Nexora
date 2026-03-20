import { useState, useEffect, useRef } from 'react';
import { Search, Users, Send, UserCheck, X, ArrowRight, Zap } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useTeamsStore, Team } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Action {
  id: string; label: string; sub?: string;
  icon: React.ReactNode; run: () => void; category: string;
}

export function CommandPalette() {
  const { setCommandOpen, setBroadcastOpen, toast } = useUIStore();
  const { teams, setSelectedTeam, checkIn } = useTeamsStore();
  const { activeHackathon } = useHackathonStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const close = () => setCommandOpen(false);

  const staticActions: Action[] = [
    { id: 'teams', label: 'Teams', icon: <Users className="w-4 h-4" />, category: 'Navigate', run: () => { navigate('/teams'); close(); } },
    { id: 'checkin', label: 'Check-in Station', icon: <UserCheck className="w-4 h-4" />, category: 'Navigate', run: () => { navigate('/checkin'); close(); } },
    ...(isAdmin ? [{ id: 'broadcast', label: 'Send Broadcast', sub: 'Message all teams', icon: <Send className="w-4 h-4" />, category: 'Actions', run: () => { setBroadcastOpen(true); close(); } }] : []),
  ];

  const teamActions: Action[] = teams
    .filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.participants.some((p) => p.name.toLowerCase().includes(q.toLowerCase())))
    .slice(0, 6)
    .map((t) => ({
      id: `t-${t.id}`, label: t.name,
      sub: `${t.participants.length} members · ${t.status.replace('_', ' ')}${t.room ? ` · ${t.room}` : ''}`,
      icon: <div className="w-5 h-5 rounded-full bg-ink/10 flex items-center justify-center text-[10px] font-bold">{t.name[0]}</div>,
      category: 'Teams',
      run: () => { setSelectedTeam(t); navigate('/teams'); close(); },
    }));

  const checkinActions: Action[] = q
    ? teams
        .filter((t) => t.status === 'REGISTERED' && t.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 3)
        .map((t) => ({
          id: `ci-${t.id}`, label: `Check in ${t.name}`,
          icon: <UserCheck className="w-4 h-4 text-success" />,
          category: 'Quick',
          run: async () => {
            if (activeHackathon) { await checkIn(activeHackathon.id, t.id); toast(`${t.name} checked in`, 'success'); }
            close();
          },
        }))
    : [];

  const all = q ? [...checkinActions, ...teamActions, ...staticActions.filter((a) => a.label.toLowerCase().includes(q.toLowerCase()))] : [...staticActions, ...teamActions];

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, all.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && all[cursor]) all[cursor].run();
    if (e.key === 'Escape') close();
  };

  const grouped = all.reduce<Record<string, Action[]>>((acc, a) => {
    acc[a.category] = [...(acc[a.category] || []), a];
    return acc;
  }, {});

  let gi = 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-modal animate-slide-up sm:animate-scale-in overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line/60 flex-shrink-0">
          <Search className="w-4 h-4 text-ink-ghost flex-shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setCursor(0); }}
            onKeyDown={handleKey}
            placeholder="Search teams, actions…"
            className="flex-1 bg-transparent text-sm placeholder:text-ink-ghost focus:outline-none"
          />
          <button onClick={close} className="w-7 h-7 rounded-full bg-line/60 flex items-center justify-center press-sm">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {all.length === 0 ? (
            <p className="text-center text-sm text-ink-ghost py-10">No results for "{q}"</p>
          ) : (
            Object.entries(grouped).map(([cat, actions]) => (
              <div key={cat} className="mb-2">
                <p className="text-[10px] font-bold text-ink-ghost uppercase tracking-widest px-3 py-1.5">{cat}</p>
                {actions.map((action) => {
                  const idx = gi++;
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      onMouseEnter={() => setCursor(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors press-sm',
                        cursor === idx ? 'bg-ink text-white' : 'hover:bg-line/60'
                      )}
                    >
                      <div className={cn('flex-shrink-0', cursor === idx ? 'text-white' : 'text-ink-muted')}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{action.label}</p>
                        {action.sub && <p className={cn('text-xs truncate', cursor === idx ? 'text-white/60' : 'text-ink-ghost')}>{action.sub}</p>}
                      </div>
                      <ArrowRight className={cn('w-3.5 h-3.5 flex-shrink-0', cursor === idx ? 'text-white/60' : 'text-ink-ghost opacity-0 group-hover:opacity-100')} />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-3 border-t border-line/60 flex-shrink-0 pb-safe">
          {[['↑↓', 'navigate'], ['↵', 'select'], ['Esc', 'close']].map(([k, l]) => (
            <span key={k} className="flex items-center gap-1 text-[10px] text-ink-ghost">
              <kbd className="font-mono bg-line px-1.5 py-0.5 rounded-lg text-[10px]">{k}</kbd> {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
