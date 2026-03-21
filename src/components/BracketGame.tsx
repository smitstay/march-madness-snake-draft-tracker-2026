import type { BracketGame as BracketGameType, BracketTeam } from '../types';
import { getTeamOwner, getTeamDraftName } from '../utils/teamMatcher';
import { LiveIndicator } from './LiveIndicator';

interface BracketGameProps {
  game: BracketGameType;
}

function TeamRow({ team, gameState, isTop }: { team: BracketTeam; gameState: string; isTop: boolean }) {
  const owner = getTeamOwner(team);
  const displayName = getTeamDraftName(team) || team.nameShort || '—';
  const isFinal = gameState === 'F';
  const isLive = gameState === 'I';
  const isWinner = isFinal && team.isWinner;
  const isLoser = isFinal && !team.isWinner;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-[5px] text-xs transition-colors
        ${isTop ? 'border-b border-white/[0.04]' : ''}
        ${isWinner ? 'bg-white/[0.08]' : ''}
        ${isLoser ? 'opacity-35' : ''}
      `}
    >
      <span className="w-[18px] shrink-0 text-center font-['DM_Sans'] text-[10px] font-bold text-white/35">
        {team.seed || ''}
      </span>

      {owner && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: owner.colorHex }}
        />
      )}

      <span
        className={`min-w-0 flex-1 truncate font-['DM_Sans'] text-[11px] leading-tight
          ${isWinner ? 'font-bold text-white' : 'font-medium text-white/70'}
        `}
      >
        {displayName}
      </span>

      {(isLive || isFinal) && team.score !== null && (
        <span
          className={`shrink-0 font-['Anybody'] text-[11px] font-bold tabular-nums
            ${isWinner ? 'text-white' : 'text-white/45'}
            ${isLive ? 'text-amber-400' : ''}
          `}
        >
          {team.score}
        </span>
      )}
    </div>
  );
}

export function BracketGameCard({ game }: BracketGameProps) {
  const borderColor = game.gameState === 'I'
    ? 'border-amber-500/40'
    : game.gameState === 'F'
      ? 'border-white/[0.07]'
      : 'border-white/[0.05]';

  const isEmpty = game.teams.length < 2 || (!game.teams[0].seoname && !game.teams[1].seoname);
  const topTeam = game.teams.find(t => t.isTop) || game.teams[0];
  const bottomTeam = game.teams.find(t => !t.isTop) || game.teams[1];

  return (
    <div className={`w-[180px] overflow-hidden rounded-lg border ${borderColor} bg-[#111118]/90 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.15] hover:bg-[#16161f]`}>
      {game.gameState === 'I' && (
        <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/[0.06] px-2 py-0.5">
          <LiveIndicator />
          <span className="text-[9px] font-medium text-amber-400/70">
            {game.currentPeriod} {game.contestClock}
          </span>
        </div>
      )}
      {isEmpty ? (
        <div className="px-2 py-[9px] text-center text-[10px] text-white/15">TBD</div>
      ) : (
        <>
          <TeamRow team={topTeam} gameState={game.gameState} isTop={true} />
          <TeamRow team={bottomTeam} gameState={game.gameState} isTop={false} />
        </>
      )}
    </div>
  );
}
