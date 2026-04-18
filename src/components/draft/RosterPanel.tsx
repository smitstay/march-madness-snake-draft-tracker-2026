import type { DraftPick, DraftPlayer } from '../../types';

interface RosterPanelProps {
  players: DraftPlayer[];
  rosters: Record<string, DraftPick[]>;
  teamsPerPlayer: number;
  currentPickerName?: string;
}

export function RosterPanel({
  players,
  rosters,
  teamsPerPlayer,
  currentPickerName,
}: RosterPanelProps) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-['Anybody'] text-sm font-black uppercase tracking-wider text-white">
          Rosters
        </h3>
        <span className="font-['DM_Sans'] text-[10px] font-medium text-white/30">
          {teamsPerPlayer} teams each
        </span>
      </div>
      <div className="space-y-2">
        {players.map(player => {
          const picks = rosters[player.name] ?? [];
          const isOnClock = player.name === currentPickerName;
          const colorHex = player.colorHex;
          const count = picks.length;

          return (
            <div
              key={player.name}
              className={`overflow-hidden rounded-lg border bg-white/[0.02] px-3 py-2 transition-all ${
                isOnClock ? '' : 'border-white/[0.05]'
              }`}
              style={
                isOnClock
                  ? { borderColor: `${colorHex}60`, boxShadow: `0 0 0 1px ${colorHex}30` }
                  : undefined
              }
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorHex, boxShadow: `0 0 8px ${colorHex}80` }}
                />
                <span className="font-['Anybody'] text-xs font-bold uppercase tracking-wider text-white">
                  {player.name}
                </span>
                {isOnClock && (
                  <span
                    className="rounded px-1.5 py-0.5 font-['DM_Sans'] text-[8px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${colorHex}25`, color: colorHex }}
                  >
                    On clock
                  </span>
                )}
                <span className="ml-auto font-['DM_Sans'] text-[10px] font-bold tabular-nums text-white/40">
                  {count}/{teamsPerPlayer}
                </span>
              </div>

              {/* Slot pips */}
              <div className="mt-1.5 flex gap-0.5">
                {Array.from({ length: teamsPerPlayer }).map((_, i) => {
                  const filled = i < count;
                  return (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full"
                      style={{
                        backgroundColor: filled ? colorHex : 'rgba(255,255,255,0.06)',
                        opacity: filled ? 0.9 : 1,
                      }}
                    />
                  );
                })}
              </div>

              {picks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {picks.map(p => (
                    <span
                      key={p.pickNumber}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-['DM_Sans'] text-[10px] font-semibold text-white/85"
                      style={{ backgroundColor: `${colorHex}14`, border: `1px solid ${colorHex}28` }}
                      title={`Round ${p.round}, Pick ${p.pickInRound} (overall ${p.pickNumber})`}
                    >
                      <span className="font-['Anybody'] text-[9px] font-black text-white/60">
                        {p.team.seed}
                      </span>
                      {p.team.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
