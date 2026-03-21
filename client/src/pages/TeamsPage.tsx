import { useState } from 'react';
import { Search, SlidersHorizontal, UserCheck, ChevronRight, X, Plus } from 'lucide-react';
import { useTeamsStore, TeamStatus, Team } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { TeamDrawer } from '@/components/teams/TeamDrawer';
import { cn, pluralize } from '@/lib/utils';

const STATUS_TABS: { label: string; value: TeamStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' }, { label: 'Waiting', value: 'REGISTERED' },
  { label: 'Checked in', value: 'CHECKED_IN' }, { label: 'Active', value: 'ACTIVE' },
  { label: 'Submitted', value: 'SUBMITTED' },
];
const STATUS_DOT: Record<string, string> = {
  REGISTERED: 'bg-[var(--border-strong)]', CHECKED_IN: 'bg-[var(--success)]',
  ACTIVE: 'bg-[var(--warning)]', SUBMITTED: 'bg-[var(--blue)]', DISQUALIFIED: 'bg-[var(--danger)]',
};

export function TeamsPage() {
  const { getFiltered, search, statusFilter, setSearch, setStatusFilter, setSelectedTeam, selectedTeam, checkIn, loading } = useTeamsStore();
  const { activeHackathon } = useHackathonStore();
  const { toast, setCreateTeamOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const teams = getFiltered();

  const handleQuickCheckin = async (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    if (!activeHackathon) return;
    try { await checkIn(activeHackathon.id, team.id); toast(`${team.name} checked in`, 'success'); }
    catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-heading">Teams</h1>
            <div className="flex items-center gap-2">
              <span className="text-caption">{teams.length} shown</span>
              {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setCreateTeamOpen(true)}><Plus className="w-3.5 h-3.5" />New team</button>}
            </div>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-disabled)' }} />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams or members…" className="input pl-9" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /></button>}
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-3">
            {STATUS_TABS.map((tab) => (
              <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-100"
                style={{ background: statusFilter === tab.value ? 'var(--text)' : 'var(--bg-muted)', color: statusFilter === tab.value ? 'white' : 'var(--text-secondary)' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-5 pb-6">
        {loading ? (
          <div className="card overflow-hidden mt-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="skeleton w-6 h-6 rounded-full" />
                <div className="flex-1 space-y-1.5"><div className="skeleton h-3.5 w-32 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-state mt-8">
            <div className="empty-icon"><SlidersHorizontal className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></div>
            <p className="font-medium" style={{ fontSize: 14 }}>No teams found</p>
            <p className="text-caption mt-1">Try adjusting your filters</p>
            <button className="btn btn-secondary btn-sm mt-4" onClick={() => { setSearch(''); setStatusFilter('ALL'); }}>Clear filters</button>
          </div>
        ) : (
          <div className="card overflow-hidden mt-4">
            {teams.map((team) => (
              <button key={team.id} onClick={() => setSelectedTeam(team)} className="table-row w-full text-left">
                <div className={cn('dot flex-shrink-0', STATUS_DOT[team.status] || 'bg-[var(--border-strong)]')} />
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 10, background: '#0A0A0A' }}>{team.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ fontSize: 14 }}>{team.name}</p>
                  <p className="text-caption">{pluralize(team.participants.length, 'member')}{team.room && ` · ${team.room}`}{team.coordinator && ` · ${team.coordinator.name}`}</p>
                </div>
                <span className={cn('badge flex-shrink-0', `badge-${team.status.toLowerCase()}`)}>{team.status.replace('_', ' ')}</span>
                {team.status === 'REGISTERED' && isAdmin && (
                  <button onClick={(e) => handleQuickCheckin(e, team)} className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--success-bg)' }}>
                    <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                  </button>
                )}
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-disabled)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedTeam && <TeamDrawer team={selectedTeam} onClose={() => setSelectedTeam(null)} />}
    </div>
  );
}
