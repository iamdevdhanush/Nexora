import { useState } from 'react';
import { Search, SlidersHorizontal, Download, UserCheck, ChevronRight } from 'lucide-react';
import { useTeamsStore, TeamStatus, Team } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { TeamDrawer } from '@/components/teams/TeamDrawer';
import { cn, pluralize } from '@/lib/utils';

const STATUS_TABS: { label: string; value: TeamStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Waiting', value: 'REGISTERED' },
  { label: 'In', value: 'CHECKED_IN' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Done', value: 'SUBMITTED' },
];

const STATUS_DOT: Record<TeamStatus, string> = {
  REGISTERED: 'bg-ink/20',
  CHECKED_IN: 'bg-success',
  ACTIVE: 'bg-amber',
  SUBMITTED: 'bg-brand',
  DISQUALIFIED: 'bg-danger',
};

export function TeamsPage() {
  const { getFiltered, search, statusFilter, setSearch, setStatusFilter, setSelectedTeam, selectedTeam, checkIn, loading } = useTeamsStore();
  const { activeHackathon } = useHackathonStore();
  const { toast } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const teams = getFiltered();

  const handleQuickCheckin = async (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    try {
      await checkIn(activeHackathon!.id, team.id);
      toast(`${team.name} checked in`, 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Teams</h1>
          <span className="text-ink-ghost text-sm font-medium">{teams.length} shown</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-ghost" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams or members…"
            className="input pl-10"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                statusFilter === tab.value
                  ? 'bg-ink text-white'
                  : 'bg-line/60 text-ink-muted hover:bg-line'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 skeleton" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-ink-ghost">
            <SlidersHorizontal className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No teams match filters</p>
          </div>
        ) : (
          <div className="card overflow-hidden mb-4">
            {teams.map((team, i) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left press-sm',
                  i !== teams.length - 1 && 'border-b border-line/60'
                )}
              >
                {/* Status dot */}
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[team.status])} />

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-ink/6 flex items-center justify-center text-xs font-bold text-ink flex-shrink-0">
                  {team.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink truncate">{team.name}</p>
                  <p className="text-xs text-ink-ghost mt-0.5">
                    {pluralize(team.participants.length, 'member')}
                    {team.room && ` · ${team.room}`}
                    {team.coordinator && ` · ${team.coordinator.name}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {team.status === 'REGISTERED' && isAdmin && (
                    <button
                      onClick={(e) => handleQuickCheckin(e, team)}
                      className="w-8 h-8 bg-success-soft rounded-xl flex items-center justify-center press-sm"
                    >
                      <UserCheck className="w-4 h-4 text-success" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-ink-ghost" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Team drawer */}
      {selectedTeam && (
        <TeamDrawer team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}
    </div>
  );
}
