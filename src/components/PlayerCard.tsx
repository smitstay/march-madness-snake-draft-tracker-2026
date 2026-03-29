import { useState } from 'react';
import type { PlayerScore } from '../types';
import { TeamPill } from './TeamPill';

interface PlayerCardProps {
  score: PlayerScore;
  rank: number;
  leaderPoints: number;
  globalMax: number;
}

export function PlayerCard({ score, rank, leaderPoints, globalMax }: PlayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { player, points, maxPotential, teamsAlive, teamsEliminated, teamResults } = score;
  const inPrizePosition = rank <= 3;
  const isMathEliminated = !inPrizePosition && maxPotential < leaderPoints;

  const aliveTeams = teamResults.filter(t => t.alive).sort((a, b) => b.wins - a.wins);
  const eliminatedTeams = teamResults.filter(t => t.eliminated).sort((a, b) => b.wins - a.wins);

  const potentialBarWidth = maxPotential > 0 ? (points / maxPotential) * 100 : 0;

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
        {/* Rank */}
        {rank <= 3 ? (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-['Anybody'] text-sm font-black ${
              rank === 1
                ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40'
                : rank === 2
                  ? 'bg-slate-300/15 text-slate-300 ring-1 ring-slate-300/30'
                  : 'bg-amber-700/20 text-amber-600 ring-1 ring-amber-700/30'
            }`}
          >
            {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-['Anybody'] text-sm font-bold text-white/50">
            {rank}
          </div>
        )}

        {/* Player name + color */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className="h-3 w-3 shrink-0 rounded-full shadow-lg"
            style={{ backgroundColor: player.colorHex, boxShadow: `0 0 8px ${player.colorHex}60` }}
          />
          <span className={`truncate font-['Anybody'] text-base font-bold tracking-wide sm:text-lg ${isMathEliminated ? 'text-white/40' : 'text-white'}`}>
            {player.name}
          </span>
          {isMathEliminated && (
            <span className="shrink-0 rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 font-['DM_Sans'] text-[9px] font-bold uppercase tracking-wider text-red-400/80">
              Out
            </span>
          )}
        </div>

        {/* Points */}
        <div className="text-right">
          <div className={`font-['Anybody'] text-2xl font-black tabular-nums sm:text-3xl ${isMathEliminated ? 'text-white/40' : 'text-white'}`}>
            {points}
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-white/40">pts</div>
        </div>

        {/* Max potential bar */}
        <div className="w-16 sm:w-28">
          <div className="mb-1 flex justify-between text-[10px] text-white/40">
            <span>Max {maxPotential}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06] sm:h-2">
            <div className="relative h-full rounded-full transition-all duration-700" style={{ width: `${(maxPotential / globalMax) * 100}%` }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${potentialBarWidth}%`, backgroundColor: player.colorHex }}
              />
              <div
                className="absolute inset-y-0 right-0 rounded-full opacity-30"
                style={{
                  left: `${potentialBarWidth}%`,
                  backgroundColor: player.colorHex,
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Teams alive */}
        <div className="text-center">
          <div className="font-['DM_Sans'] text-xs font-bold text-white/70 sm:text-sm">
            {teamsAlive}<span className="text-white/30">/{teamsAlive + teamsEliminated}</span>
          </div>
          <div className="text-[9px] text-white/30 sm:text-[10px]">alive</div>
        </div>

        {/* Expand chevron */}
        <svg
          className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded teams */}
      <div
        className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="border-t border-white/[0.06] px-4 py-3 sm:px-5">
          {/* Mobile potential bar */}
          <div className="mb-3 sm:hidden">
            <div className="mb-1 flex justify-between text-[10px] text-white/40">
              <span>{teamsAlive} alive · {teamsEliminated} eliminated</span>
              <span>Max {maxPotential}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="relative h-full rounded-full" style={{ width: `${(maxPotential / globalMax) * 100}%` }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${potentialBarWidth}%`, backgroundColor: player.colorHex }}
                />
                <div
                  className="absolute inset-y-0 right-0 rounded-full opacity-30"
                  style={{
                    left: `${potentialBarWidth}%`,
                    backgroundColor: player.colorHex,
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)`,
                  }}
                />
              </div>
            </div>
          </div>

          {aliveTeams.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {aliveTeams.map(t => <TeamPill key={t.teamName} team={t} />)}
            </div>
          )}
          {eliminatedTeams.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {eliminatedTeams.map(t => <TeamPill key={t.teamName} team={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
