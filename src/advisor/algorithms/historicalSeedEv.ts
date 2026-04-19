import { expectedWinsForSeed } from '../../data/seedStats';
import type { AlgorithmDef } from '../types';

/**
 * #2 · Historical Seed EV.
 *
 * Pure baseline: each team's score is the historical average tournament wins
 * for its seed since 1985 (1-seed ≈ 3.45, 8-seed ≈ 0.87, 16-seed ≈ 0.02).
 * Doesn't look at your roster at all — a sanity floor for the other algos.
 */
export const historicalSeedEvAlgo: AlgorithmDef = {
  id: 'historicalSeedEv',
  name: 'Historical Seed EV',
  short: 'EV',
  description: 'Historical avg tournament wins for each seed since 1985.',
  run: ({ available }) => ({
    algorithmId: 'historicalSeedEv',
    ranked: available
      .map(team => {
        const ev = expectedWinsForSeed(team.seed);
        return {
          team,
          score: ev,
          display: ev.toFixed(2),
          reason: `${ev.toFixed(2)} expected wins (#${team.seed} seed historical)`,
        };
      })
      .sort((a, b) => b.score - a.score),
  }),
};
