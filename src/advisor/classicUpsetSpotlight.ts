import type { DraftTeam } from '../types';
import { UPSET_SLOTS } from '../data/seedStats';

/**
 * #8 · Classic Upset Spotlight (overlay helper).
 *
 * Returns the classic upset-slot info for a team (12-over-5, 11-over-6, etc)
 * with the historical R1 hit rate, or null if the team isn't in a famous
 * upset slot. Used by TeamCard/Advisor to show a badge on the team.
 */
export function upsetInfo(team: DraftTeam): { rate: number; label: string } | null {
  const slot = UPSET_SLOTS[team.seed];
  return slot ? { rate: slot.rate, label: slot.label } : null;
}
