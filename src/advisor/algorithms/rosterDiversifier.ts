import { earliestMeetingRound } from '../bracketGeometry';
import type { Round } from '../../data/seedStats';
import type { AlgorithmDef } from '../types';

/**
 * Collision penalty by how early the meeting is. Earlier = more damaging.
 * These are heuristic weights (probability-free) — see
 * collisionAdjustedSeedMarkov.ts for the probability-weighted variant.
 */
const COLLISION_PENALTY: Record<Round, number> = {
  R64: 1.0,
  R32: 0.6,
  S16: 0.35,
  E8: 0.2,
  F4: 0.1,
  NCG: 0.05,
  CHAMP: 0,
};

/**
 * #7 · Roster Diversifier.
 *
 * Probability-free nudge against stacking the same quadrant/region as your
 * existing roster. Simple, interpretable, fast — pair it with
 * Collision-Adjusted Seed Markov (which uses the same idea but weighted by
 * historical reach probabilities).
 *
 *   score = −Σ over owned U: PENALTY[earliestMeetingRound(candidate, U)]
 */
export const rosterDiversifierAlgo: AlgorithmDef = {
  id: 'rosterDiversifier',
  name: 'Roster Diversifier',
  short: 'DIV',
  description: 'Avoid stacking the same quadrant/region as your existing roster.',
  run: ({ available, owned }) => ({
    algorithmId: 'rosterDiversifier',
    ranked: available
      .map(team => {
        let penalty = 0;
        let worst: { round: Round; against: string } | null = null;
        for (const u of owned) {
          const round = earliestMeetingRound(team, u);
          if (!round) continue;
          const p = COLLISION_PENALTY[round] ?? 0;
          penalty += p;
          if (!worst || p > (COLLISION_PENALTY[worst.round] ?? 0)) {
            worst = { round, against: u.name };
          }
        }
        const reason = worst
          ? `${worst.round} collision with ${worst.against}`
          : owned.length > 0
            ? 'No collisions before Final Four'
            : 'Open roster — pure pick';
        return {
          team,
          score: -penalty,
          display: penalty === 0 ? 'clean' : `−${penalty.toFixed(2)}`,
          reason,
        };
      })
      .sort((a, b) => b.score - a.score),
  }),
};
