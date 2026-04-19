import type { DraftTeam, Region } from '../types';
import {
  type Round,
  ROUND_ORDER,
  halfOf,
  quadrantOf,
  r1OpponentSeed,
} from '../data/seedStats';

// Final Four region pairings. Standard NCAA bracket pairs E-W and S-M (varies by year).
// Adjust here if a year's bracket pairs differently.
const REGION_PAIRS: Array<[Region, Region]> = [
  ['East', 'West'],
  ['South', 'Midwest'],
];

function regionPairIndex(region: Region): number {
  return REGION_PAIRS.findIndex(p => p.includes(region));
}

// Earliest possible meeting round between two distinct teams given (seed, region).
// Returns the round, or null if they cannot meet (same R1 slot would be impossible distinct teams).
export function earliestMeetingRound(a: DraftTeam, b: DraftTeam): Round | null {
  if (a.id === b.id) return null;

  // Same region: structural meeting depends on quadrant/half/region.
  if (a.region === b.region) {
    if (r1OpponentSeed(a.seed) === b.seed) return 'R64';
    if (quadrantOf(a.seed) === quadrantOf(b.seed)) return 'R32';
    if (halfOf(a.seed) === halfOf(b.seed)) return 'S16';
    return 'E8';
  }

  // Different regions: check Final Four pairing, else Championship.
  const pairA = regionPairIndex(a.region);
  const pairB = regionPairIndex(b.region);
  if (pairA === pairB) return 'F4';
  return 'NCG';
}

// Convenience: number of wins required to reach the meeting round (0-indexed game depth).
export function roundIndex(round: Round): number {
  return ROUND_ORDER.indexOf(round);
}
