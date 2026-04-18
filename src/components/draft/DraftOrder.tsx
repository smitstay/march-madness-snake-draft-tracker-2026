import type { DraftPlayer } from '../../types';
import { roundOrder } from '../../utils/draftOrder';

interface DraftOrderProps {
  players: DraftPlayer[];
  round: number;
  pickInRound: number;
  totalPicks: number;
  totalPicksMade: number;
}

export function DraftOrder({
  players,
  round,
  pickInRound,
  totalPicks,
  totalPicksMade,
}: DraftOrderProps) {
  const order = roundOrder(round, players.length);
  const totalRounds = Math.ceil(totalPicks / players.length);
  const isReverse = round % 2 === 0;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-widest text-white/40">
            Round {round} of {totalRounds}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 font-['DM_Sans'] text-[9px] font-bold uppercase tracking-wider text-white/60"
          >
            {isReverse ? '← Snake' : 'Snake →'}
          </span>
        </div>
        <div className="font-['DM_Sans'] text-[10px] font-medium text-white/30">
          {totalPicksMade} / {totalPicks} picks
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {order.map((playerIdx, positionInRound) => {
          const player = players[playerIdx];
          const positionNumber = positionInRound + 1;
          const isCurrent = positionNumber === pickInRound;
          const isDone = positionNumber < pickInRound;
          const colorHex = player.colorHex;

          return (
            <div
              key={`${round}-${playerIdx}`}
              className="flex shrink-0 items-center"
            >
              <div
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-300
                  ${isCurrent
                    ? 'scale-105 bg-white/[0.08]'
                    : isDone
                      ? 'border-white/[0.04] bg-transparent opacity-40'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                style={
                  isCurrent
                    ? { borderColor: `${colorHex}60`, boxShadow: `0 0 20px ${colorHex}30` }
                    : undefined
                }
              >
                <span
                  className={`h-2 w-2 rounded-full ${isDone ? 'opacity-30' : ''}`}
                  style={{ backgroundColor: colorHex }}
                />
                <span
                  className={`font-['DM_Sans'] text-xs font-semibold ${
                    isCurrent ? 'text-white' : isDone ? 'text-white/40 line-through' : 'text-white/70'
                  }`}
                >
                  {player.name}
                </span>
              </div>
              {positionInRound < order.length - 1 && (
                <svg
                  className="mx-0.5 h-3 w-3 shrink-0 text-white/20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
