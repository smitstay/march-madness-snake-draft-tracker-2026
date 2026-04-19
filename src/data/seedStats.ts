// Historical NCAA tournament data, 1985-2024 (post 64-team expansion).
// All probabilities are P(seed reaches at least round R), where R uses standard naming:
//   R1=64, R2=32, S16=16, E8=8, F4=4, NCG=2, CHAMP=1
// Source: aggregated public records; values are well-known approximations.

export type Round = 'R64' | 'R32' | 'S16' | 'E8' | 'F4' | 'NCG' | 'CHAMP';

export const ROUND_ORDER: Round[] = ['R64', 'R32', 'S16', 'E8', 'F4', 'NCG', 'CHAMP'];

// Round index (0-based) that a team must WIN to advance from that round.
// R64 is round 1 of the tournament; winning R64 gets you to R32 = 1 win.
export const WINS_BY_ROUND: Record<Round, number> = {
  R64: 0, R32: 1, S16: 2, E8: 3, F4: 4, NCG: 5, CHAMP: 6,
};

// P(seed reaches round R). Standalone (no team-specific info).
// reachProb[seed][round] = historical reach rate.
export const reachProb: Record<number, Record<Round, number>> = {
  1:  { R64: 1.000, R32: 0.987, S16: 0.866, E8: 0.700, F4: 0.470, NCG: 0.245, CHAMP: 0.184 },
  2:  { R64: 1.000, R32: 0.929, S16: 0.728, E8: 0.461, F4: 0.215, NCG: 0.118, CHAMP: 0.046 },
  3:  { R64: 1.000, R32: 0.853, S16: 0.595, E8: 0.339, F4: 0.139, NCG: 0.061, CHAMP: 0.026 },
  4:  { R64: 1.000, R32: 0.787, S16: 0.480, E8: 0.262, F4: 0.103, NCG: 0.043, CHAMP: 0.026 },
  5:  { R64: 1.000, R32: 0.647, S16: 0.345, E8: 0.156, F4: 0.063, NCG: 0.026, CHAMP: 0.009 },
  6:  { R64: 1.000, R32: 0.628, S16: 0.388, E8: 0.155, F4: 0.060, NCG: 0.026, CHAMP: 0.009 },
  7:  { R64: 1.000, R32: 0.610, S16: 0.296, E8: 0.094, F4: 0.030, NCG: 0.013, CHAMP: 0.009 },
  8:  { R64: 1.000, R32: 0.490, S16: 0.211, E8: 0.069, F4: 0.060, NCG: 0.026, CHAMP: 0.013 },
  9:  { R64: 1.000, R32: 0.510, S16: 0.139, E8: 0.030, F4: 0.005, NCG: 0.000, CHAMP: 0.000 },
  10: { R64: 1.000, R32: 0.390, S16: 0.207, E8: 0.068, F4: 0.026, NCG: 0.000, CHAMP: 0.000 },
  11: { R64: 1.000, R32: 0.372, S16: 0.182, E8: 0.087, F4: 0.043, NCG: 0.013, CHAMP: 0.000 },
  12: { R64: 1.000, R32: 0.353, S16: 0.144, E8: 0.030, F4: 0.005, NCG: 0.000, CHAMP: 0.000 },
  13: { R64: 1.000, R32: 0.213, S16: 0.052, E8: 0.013, F4: 0.000, NCG: 0.000, CHAMP: 0.000 },
  14: { R64: 1.000, R32: 0.153, S16: 0.022, E8: 0.000, F4: 0.000, NCG: 0.000, CHAMP: 0.000 },
  15: { R64: 1.000, R32: 0.071, S16: 0.013, E8: 0.009, F4: 0.005, NCG: 0.000, CHAMP: 0.000 },
  16: { R64: 1.000, R32: 0.013, S16: 0.004, E8: 0.000, F4: 0.000, NCG: 0.000, CHAMP: 0.000 },
};

// Expected wins per seed across the tournament (sum of advance probs from R32..CHAMP).
export function expectedWinsForSeed(seed: number): number {
  const probs = reachProb[seed];
  if (!probs) return 0;
  return ROUND_ORDER.slice(1).reduce((s, r) => s + probs[r], 0);
}

// E[wins from round R onwards | team reaches round R]. Conditional on being alive at R.
export function expectedRemainingWins(seed: number, fromRound: Round): number {
  const probs = reachProb[seed];
  if (!probs) return 0;
  const baseline = probs[fromRound];
  if (baseline <= 0) return 0;
  const startIdx = ROUND_ORDER.indexOf(fromRound);
  let sum = 0;
  for (let i = startIdx + 1; i < ROUND_ORDER.length; i++) {
    sum += probs[ROUND_ORDER[i]] / baseline;
  }
  return sum;
}

// Standard NCAA R1 seed pairings within a region.
export const R1_PAIRINGS: Array<[number, number]> = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

export function r1OpponentSeed(seed: number): number | null {
  for (const [a, b] of R1_PAIRINGS) {
    if (a === seed) return b;
    if (b === seed) return a;
  }
  return null;
}

// Quadrants of a region (4 R1 games -> 2 R32 games -> 1 S16 game -> 1 E8 game).
// Top half of region: {1,16,8,9} & {5,12,4,13} -> meet in S16
// Bot half of region: {6,11,3,14} & {7,10,2,15} -> meet in S16
// Halves meet in E8.
export const QUADRANTS: number[][] = [
  [1, 16, 8, 9],
  [5, 12, 4, 13],
  [6, 11, 3, 14],
  [7, 10, 2, 15],
];

export const REGION_HALVES: number[][] = [
  [1, 16, 8, 9, 5, 12, 4, 13],
  [6, 11, 3, 14, 7, 10, 2, 15],
];

export function quadrantOf(seed: number): number {
  return QUADRANTS.findIndex(q => q.includes(seed));
}

export function halfOf(seed: number): number {
  return REGION_HALVES.findIndex(h => h.includes(seed));
}

// Famous upset slots. R1 historical hit rates (approximate).
export const UPSET_SLOTS: Record<number, { higherSeed: number; rate: number; label: string }> = {
  12: { higherSeed: 5,  rate: 0.353, label: '12 over 5' },
  11: { higherSeed: 6,  rate: 0.372, label: '11 over 6' },
  10: { higherSeed: 7,  rate: 0.390, label: '10 over 7' },
  13: { higherSeed: 4,  rate: 0.213, label: '13 over 4' },
  14: { higherSeed: 3,  rate: 0.153, label: '14 over 3' },
  15: { higherSeed: 2,  rate: 0.071, label: '15 over 2' },
};
