import type { PlayerScore } from '../types';
import { PlayerCard } from './PlayerCard';

interface ScoreboardProps {
  scores: PlayerScore[];
}

export function Scoreboard({ scores }: ScoreboardProps) {
  const leaderPoints = scores.length > 0 ? scores[0].points : 0;
  const globalMax = scores.length > 0 ? Math.max(...scores.map(s => s.maxPotential)) : 48;

  // Compute competition ranks (tied players share the same rank)
  const ranks: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    if (i === 0) {
      ranks.push(1);
    } else if (scores[i].points === scores[i - 1].points && scores[i].maxPotential === scores[i - 1].maxPotential) {
      ranks.push(ranks[i - 1]);
    } else {
      ranks.push(i + 1);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h2 className="font-['Anybody'] text-2xl font-black uppercase tracking-wider text-white sm:text-3xl">
          Leaderboard
        </h2>
        <p className="mt-1 font-['DM_Sans'] text-sm text-white/40">
          1 point per tournament win · Top 3 pay out · Click to expand
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {scores.map((score, i) => (
          <div
            key={score.player.name}
            className="animate-[fadeSlideIn_0.4s_ease-out_both]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <PlayerCard score={score} rank={ranks[i]} leaderPoints={leaderPoints} globalMax={globalMax} />
          </div>
        ))}
      </div>
    </div>
  );
}
