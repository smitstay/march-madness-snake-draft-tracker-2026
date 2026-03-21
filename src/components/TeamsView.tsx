import type { PlayerScore } from '../types';
import { TeamPill } from './TeamPill';
import { players } from '../data/picks';

interface TeamsViewProps {
  scores: PlayerScore[];
}

export function TeamsView({ scores }: TeamsViewProps) {
  const scoreMap = new Map(scores.map(s => [s.player.name, s]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h2 className="font-['Anybody'] text-2xl font-black uppercase tracking-wider text-white sm:text-3xl">
          All Teams
        </h2>
        <p className="mt-1 font-['DM_Sans'] text-sm text-white/40">
          8 players · 8 teams each · Snake draft order
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {players.map((player, i) => {
          const score = scoreMap.get(player.name);
          const teamResults = score?.teamResults || [];

          return (
            <div
              key={player.name}
              className="animate-[fadeSlideIn_0.4s_ease-out_both] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Player header */}
              <div
                className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3"
                style={{ backgroundColor: `${player.colorHex}08` }}
              >
                <div
                  className="h-3 w-3 rounded-full shadow-lg"
                  style={{ backgroundColor: player.colorHex, boxShadow: `0 0 10px ${player.colorHex}50` }}
                />
                <span className="font-['Anybody'] text-base font-bold tracking-wide text-white">
                  {player.name}
                </span>
                {score && (
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 font-['Anybody'] text-xs font-bold"
                    style={{ backgroundColor: `${player.colorHex}25`, color: player.colorHex }}
                  >
                    {score.points} pts
                  </span>
                )}
              </div>

              {/* Teams */}
              <div className="flex flex-wrap gap-1.5 p-3">
                {teamResults.length > 0 ? (
                  teamResults
                    .sort((a, b) => (b.alive ? 1 : 0) - (a.alive ? 1 : 0) || b.wins - a.wins)
                    .map(t => <TeamPill key={t.teamName} team={t} compact />)
                ) : (
                  player.teams.map(name => (
                    <span key={name} className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-white/50">
                      {name}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
