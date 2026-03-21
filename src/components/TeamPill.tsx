import type { TeamResult } from '../types';

interface TeamPillProps {
  team: TeamResult;
  compact?: boolean;
}

export function TeamPill({ team, compact = false }: TeamPillProps) {
  const eliminated = team.eliminated;
  const colorHex = team.owner.colorHex;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1
        font-['DM_Sans'] text-xs font-semibold transition-all duration-300
        ${eliminated
          ? 'border-white/5 bg-white/[0.03] text-white/30 line-through'
          : 'border-white/10 bg-white/[0.06] text-white/90'
        }
      `}
      style={!eliminated ? { borderColor: `${colorHex}40`, backgroundColor: `${colorHex}15` } : undefined}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${eliminated ? 'bg-white/20' : ''}`}
        style={!eliminated ? { backgroundColor: colorHex } : undefined}
      />
      <span className={compact ? 'max-w-[80px] truncate' : ''}>
        {team.teamName}
      </span>
      {team.wins > 0 && (
        <span
          className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
            eliminated ? 'bg-white/5 text-white/30' : 'text-white'
          }`}
          style={!eliminated ? { backgroundColor: `${colorHex}50` } : undefined}
        >
          {team.wins}W
        </span>
      )}
    </span>
  );
}
