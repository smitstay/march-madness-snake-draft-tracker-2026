import { reachProb } from '../../data/seedStats';
import type { AlgorithmDef } from '../types';

/**
 * #11 · Ceiling Pick.
 *
 *   score = P(reaches Final Four | wins R1)
 *         = reachProb[F4] / reachProb[R32]
 *
 * The "lottery slot" metric: if this team survives R1, how excited should you
 * be about their remaining run? 1-seeds top out here (they just keep winning)
 * but it also correctly orders mid-seed Cinderellas: 11 > 12 > 13 historically.
 */
export const ceilingPickAlgo: AlgorithmDef = {
  id: 'ceilingPick',
  name: 'Ceiling Pick',
  short: 'CEIL',
  description: 'P(reaches Final Four | wins R1). Best lottery-ticket pick.',
  run: ({ available }) => ({
    algorithmId: 'ceilingPick',
    ranked: available
      .map(team => {
        const p = reachProb[team.seed];
        const r32 = p?.R32 ?? 0;
        const f4 = p?.F4 ?? 0;
        const conditional = r32 > 0 ? f4 / r32 : 0;
        return {
          team,
          score: conditional,
          display: `${(conditional * 100).toFixed(1)}%`,
          reason: `${(conditional * 100).toFixed(1)}% to make F4 if they survive R1`,
        };
      })
      .sort((a, b) => b.score - a.score),
  }),
};
