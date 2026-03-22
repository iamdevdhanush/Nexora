import { useState } from 'react';
import { Search, UserCheck, X, Plus, SlidersHorizontal } from 'lucide-react';
import { useTeamsStore, TeamStatus, Team } from '@/store/teamsStore';
import { useHackathonStore } from '@/store/hackathonStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { TeamDrawer } from '@/components/teams/TeamDrawer';
import { cn, pluralize, initials } from '@/lib/utils';

const STATUS_TABS: { label: string; value: TeamStatus | 'ALL'; color?: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Waiting', value: 'REGISTERED' },
  { label: 'Checked in', value: 'CHECKED_IN', color: 'var(--green)' },
  { label: 'Active', value: 'ACTIVE', color: 'var(--yellow)' },
  { label: 'Submitted', value: 'SUBMITTED', color: 'var(--blue)' },
];

const STATUS_DOT: Record<string, string> = {
  REGISTERED: 'dot-registered',
  CHECKED_IN: 'dot-checked_in',
  ACTIVE: 'dot-active',
  SUBMITTED: 'dot-submitted',
  DISQUALIFIED: 'dot-disqualified',
};

function TeamCard({ team, onSelect, onCheckIn, isAdmin }: {
  team: Team;
  onSelect: (t: Team) => void;
  onCheckIn: (e: React.MouseEvent, t: Team) => void;
  isAdmin: boolean;
}) {
  return (
    <div
      className="team-card"
      onClick={() => onSelect(team)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="avatar avatar-md flex-shrink-0 font-display"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            {initials(team.name)}
          </div>
          <div className="min-w-0">
            <p
              className="font-display font-bold truncate"
              style={{ fontSize: 15, color: 'var(--text)', letterSpacing: '-0.01em' }}
            >
              {team.name}
            </p>
            {team.room && (
              <p className="text-caption font-mono mt-0.5">{team.room}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('badge', `badge-${team.status.toLowerCase()}`)}>
            <span className={cn('dot', STATUS_DOT[team.status] || '')} style={{ width: 5, height: 5 }} />
            {team.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex -space-x-2">
          {team.participants.slice(0, 4).map((p, i) => (
            <div
              key={p.id}
              className="w-6 h-6 rounded-full flex items-center justify-center border"
              style={{
                background: 'var(--bg-elevated)',
                border: '1.5px solid var(--bg-card)',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                fontFamily: 'Syne, sans-serif',
                zIndex: 4 - i,
              }}
              title={p.name}
            >
              {p.name[0]}
            </div>
          ))}
          {team.participants.length > 4 && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center border"
              style={{
                background: 'var(--bg-muted)',
                border: '1.5px solid var(--bg-card)',
                fontSize: 8,
                color: 'var(--text-muted)',
              }}
            >
              +{team.participants.length - 4}
            </div>
          )}
        </div>
        <p className="text-caption">{pluralize(team.participants.length, 'member')}</p>
        {team.coordinator && (
          <span
            className="ml-auto text-caption truncate"
            style={{ maxWidth: 80 }}
          >
            {team.coordinator.name}
          </span>
        )}
      </div>

      {/* Project */}
      {team.projectName && (
        <p
          className="text-caption truncate mb-3 px-2.5 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        >
          🚀 {team.projectName}
        </p>
      )}

      {/* Bottom row */}
      {isAdmin && team.status === 'REGISTERED' && (
        <button
          onClick={(e) => onCheckIn(e, team)}
          className="w-full flex items-center justify-center gap-2 rounded-xl transition-colors duration-150"
          style={{
            height: 36,
            background: 'var(--green-dim)',
            border: '1px solid rgba(0,232,122,0.2)',
            color: 'var(--green)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,232,122,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--green-dim)';
          }}
        >
          <UserCheck className="w-3.5 h-3.5" /> Check In
        </button>
      )}
    </div>
  );
}

export function TeamsPage() {
  const { getFiltered, search, statusFilter, setSearch, setStatusFilter, setSelectedTeam, selectedTeam, checkIn, loading } =
    useTeamsStore();
  const { activeHackathon } = useHackathonStore();
  const { toast, setCreateTeamOpen } = useUIStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const teams = getFiltered();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleQuickCheckIn = async (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    if (!activeHackathon) return;
    try {
      await checkIn(activeHackathon.id, team.id);
      toast(`✓ ${team.name} checked in`, 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="px-5 pt-5 pb-0">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-heading">Teams</h1>
              <p className="text-caption mt-0.5">{teams.length} shown</p>
            </div>
            {isAdmin && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setCreateTeamOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                New team
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-disabled)' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams or members…"
              className="input pl-10"
            />
            {search && (
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                onClick={() => setSearch('')}
              >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn('filter-chip', statusFilter === tab.value && 'active')}
              >
                {tab.color && statusFilter === tab.value && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: tab.color, boxShadow: `0 0 6px ${tab.color}` }}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 py-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="skeleton w-9 h-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-32 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                </div>
                <div className="skeleton h-3 w-24 rounded mb-4" />
                <div className="skeleton h-8 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <SlidersHorizontal className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-title mb-2">No teams found</p>
            <p className="text-caption mb-6">Try adjusting your filters</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onSelect={setSelectedTeam}
                onCheckIn={handleQuickCheckIn}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {selectedTeam && (
        <TeamDrawer team={selectedTeam} onClose={() => setSelectedTeam(null)} />
      )}
    </div>
  );
}
