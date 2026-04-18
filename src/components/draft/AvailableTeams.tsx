import { useMemo, useState } from 'react';
import type { DraftPlayer, DraftTeam, Region } from '../../types';
import { TeamCard } from './TeamCard';

type RegionFilter = 'All' | Region;
type SortMode = 'seed' | 'region' | 'name';

const regions: RegionFilter[] = ['All', 'East', 'West', 'South', 'Midwest'];

interface AvailableTeamsProps {
  teams: DraftTeam[];
  totalTeams: number;
  picker: DraftPlayer | null;
  onPick: (team: DraftTeam) => void;
}

export function AvailableTeams({ teams, totalTeams, picker, onPick }: AvailableTeamsProps) {
  const [region, setRegion] = useState<RegionFilter>('All');
  const [sort, setSort] = useState<SortMode>('seed');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = teams;
    if (region !== 'All') list = list.filter(t => t.region === region);
    if (q) list = list.filter(t => t.name.toLowerCase().includes(q));
    const sorted = [...list];
    if (sort === 'seed') {
      sorted.sort((a, b) => a.seed - b.seed || a.region.localeCompare(b.region));
    } else if (sort === 'region') {
      sorted.sort((a, b) => a.region.localeCompare(b.region) || a.seed - b.seed);
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [teams, region, sort, query]);

  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-['Anybody'] text-sm font-black uppercase tracking-wider text-white">
            Available Teams
          </h3>
          <p className="mt-0.5 font-['DM_Sans'] text-[11px] text-white/40">
            {teams.length} of {totalTeams} remaining
          </p>
        </div>

        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-40 rounded-lg border border-white/[0.06] bg-white/[0.02] py-1.5 pl-8 pr-2.5 font-['DM_Sans'] text-xs text-white placeholder-white/25 transition-colors focus:border-white/20 focus:outline-none focus:ring-0 sm:w-56"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-md border px-2.5 py-1 font-['DM_Sans'] text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                region === r
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                  : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.15] hover:text-white/80'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-widest text-white/30">
            Sort
          </span>
          {(['seed', 'region', 'name'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSort(mode)}
              className={`rounded-md px-2 py-0.5 font-['DM_Sans'] text-[10px] font-bold uppercase tracking-wider transition-colors ${
                sort === mode
                  ? 'bg-white/[0.1] text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] py-10 text-center">
          <p className="font-['DM_Sans'] text-sm text-white/40">No teams match your filter.</p>
          <button
            onClick={() => { setRegion('All'); setQuery(''); }}
            className="mt-2 font-['DM_Sans'] text-xs font-semibold text-amber-400 hover:text-amber-300"
          >
            Clear filters
          </button>
        </div>
      ) : picker ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((team, i) => (
            <div
              key={team.id}
              className="animate-[fadeSlideIn_0.3s_ease-out_both]"
              style={{ animationDelay: `${Math.min(i * 15, 250)}ms` }}
            >
              <TeamCard
                team={team}
                onPick={onPick}
                picker={picker}
                pickerColor={picker.colorHex}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center font-['DM_Sans'] text-sm text-white/40">
          Draft complete.
        </div>
      )}
    </section>
  );
}
