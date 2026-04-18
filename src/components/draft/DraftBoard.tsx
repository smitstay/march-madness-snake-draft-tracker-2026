import type { DraftPick, DraftPlayer } from '../../types';

interface DraftBoardProps {
  picks: DraftPick[];
  players: DraftPlayer[];
}

export function DraftBoard({ picks, players }: DraftBoardProps) {
  const colorByName: Record<string, string> = {};
  for (const p of players) colorByName[p.name] = p.colorHex;

  const reversed = [...picks].reverse();

  if (picks.length === 0) {
    return (
      <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-10 text-center">
        <div className="mb-2 text-2xl opacity-40">🎯</div>
        <p className="font-['DM_Sans'] text-sm text-white/50">No picks yet</p>
        <p className="mt-1 font-['DM_Sans'] text-[11px] text-white/30">
          The first pick will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-['Anybody'] text-sm font-black uppercase tracking-wider text-white">
          Draft Board
        </h3>
        <span className="font-['DM_Sans'] text-[10px] font-medium text-white/30">
          Most recent first
        </span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 480 }}>
        {reversed.map((pick, idx) => {
          const color = colorByName[pick.playerName] ?? '#fbbf24';
          const isLatest = idx === 0;
          return (
            <div
              key={pick.pickNumber}
              className={`animate-[fadeSlideIn_0.3s_ease-out_both] flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                isLatest ? 'bg-white/[0.04]' : 'bg-white/[0.02]'
              }`}
              style={{
                borderColor: isLatest ? `${color}50` : 'rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex h-7 w-11 shrink-0 items-center justify-center rounded-md bg-white/[0.05] font-['Anybody'] text-[11px] font-black tabular-nums text-white/60">
                {pick.round}.{pick.pickInRound}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-['DM_Sans'] text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
                    {pick.playerName}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 truncate">
                  <span className="rounded bg-white/[0.06] px-1 font-['Anybody'] text-[9px] font-black tabular-nums text-white/60">
                    {pick.team.seed}
                  </span>
                  <span className="truncate font-['DM_Sans'] text-[13px] font-semibold text-white">
                    {pick.team.name}
                  </span>
                </div>
              </div>
              <span className="shrink-0 font-['Anybody'] text-[11px] font-black tabular-nums text-white/25">
                #{pick.pickNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
