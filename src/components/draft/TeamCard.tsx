import type { DraftTeam, DraftPlayer } from '../../types';
import { upsetInfo } from '../../utils/advisor';

interface TeamCardProps {
  team: DraftTeam;
  onPick: (team: DraftTeam) => void;
  pickerColor: string;
  picker: DraftPlayer;
  disabled?: boolean;
}

const regionColor: Record<string, string> = {
  East: 'text-sky-300/80',
  West: 'text-rose-300/80',
  South: 'text-emerald-300/80',
  Midwest: 'text-violet-300/80',
};

function seedTier(seed: number): 'top' | 'mid' | 'low' {
  if (seed <= 4) return 'top';
  if (seed <= 10) return 'mid';
  return 'low';
}

export function TeamCard({ team, onPick, pickerColor, picker, disabled }: TeamCardProps) {
  const tier = seedTier(team.seed);
  const upset = upsetInfo(team);

  return (
    <button
      onClick={() => !disabled && onPick(team)}
      disabled={disabled}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
      title={`Pick ${team.name} for ${picker.name}`}
    >
      {/* Hover color wash in current picker's color */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${pickerColor}18, transparent 60%)` }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${pickerColor}60` }}
      />

      <div
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-['Anybody'] text-base font-black tabular-nums
          ${tier === 'top'
            ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25'
            : tier === 'mid'
              ? 'bg-white/[0.06] text-white/80 ring-1 ring-white/10'
              : 'bg-white/[0.03] text-white/50 ring-1 ring-white/5'
          }`}
      >
        {team.seed}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-['Anybody'] text-sm font-bold tracking-wide text-white">
            {team.name}
          </span>
          {upset && (
            <span
              className="shrink-0 rounded bg-orange-500/15 px-1 py-0.5 font-['DM_Sans'] text-[8px] font-bold uppercase tracking-wider text-orange-300"
              title={`Classic ${upset.label} slot — historically ${(upset.rate * 100).toFixed(0)}% R1 win rate`}
            >
              Upset {(upset.rate * 100).toFixed(0)}%
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 font-['DM_Sans'] text-[10px] font-semibold uppercase tracking-wider">
          <span className={regionColor[team.region] ?? 'text-white/50'}>
            {team.region}
          </span>
          {team.record && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-white/40">{team.record}</span>
            </>
          )}
        </div>
      </div>

      <div
        className="relative flex h-7 shrink-0 items-center gap-1 rounded-md px-2 font-['DM_Sans'] text-[10px] font-bold uppercase tracking-widest opacity-0 transition-all duration-200 group-hover:opacity-100"
        style={{ backgroundColor: `${pickerColor}22`, color: pickerColor }}
      >
        Pick
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
