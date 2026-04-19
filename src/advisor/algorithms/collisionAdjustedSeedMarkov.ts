import {
  expectedRemainingWins,
  expectedWinsForSeed,
  reachProb,
  type Round,
} from '../../data/seedStats';
import { earliestMeetingRound } from '../bracketGeometry';
import type { AlgorithmDef } from '../types';

/**
 * #5 · Collision-Adjusted Seed Markov.
 *
 * Marginal expected roster wins from adding a candidate team T, given the
 * roster already owned:
 *
 *   score(T) = standaloneEV(T)
 *            − Σ over owned U:
 *                  P(T reaches R) · P(U reaches R)          // joint meeting
 *                · min(remEV(T @ R), remEV(U @ R))          // expected wins lost
 *
 *   where R = earliestMeetingRound(T, U).
 *
 * Approximation: joint reach uses independence (P(A) · P(B)), which slightly
 * overestimates when both teams live in the same region. Good enough for
 * ranking; a full bracket DP would give exact numbers.
 */
export const collisionAdjustedSeedMarkovAlgo: AlgorithmDef = {
  id: 'collisionAdjustedSeedMarkov',
  name: 'Collision-Adjusted Seed Markov',
  short: 'COLL',
  description: 'Historical seed EV minus expected wins lost when this team collides with your roster.',
  run: ({ available, owned }) => ({
    algorithmId: 'collisionAdjustedSeedMarkov',
    ranked: available
      .map(team => {
        const standaloneEv = expectedWinsForSeed(team.seed);
        let collisionLoss = 0;
        let worst: { round: Round; against: string; loss: number } | null = null;

        for (const u of owned) {
          const round = earliestMeetingRound(team, u);
          if (!round) continue;
          const pTeamReaches = reachProb[team.seed]?.[round] ?? 0;
          const pOwnedReaches = reachProb[u.seed]?.[round] ?? 0;
          const jointMeetingProb = pTeamReaches * pOwnedReaches;
          if (jointMeetingProb <= 0) continue;

          const remTeam = expectedRemainingWins(team.seed, round);
          const remOwned = expectedRemainingWins(u.seed, round);
          const loss = jointMeetingProb * Math.min(remTeam, remOwned);

          collisionLoss += loss;
          if (!worst || loss > worst.loss) {
            worst = { round, against: u.name, loss };
          }
        }

        const net = standaloneEv - collisionLoss;
        const reason = collisionLoss < 0.01
          ? `${standaloneEv.toFixed(2)} EV · clean`
          : `${standaloneEv.toFixed(2)} EV − ${collisionLoss.toFixed(2)} (worst: ${worst!.round} vs ${worst!.against})`;

        return {
          team,
          score: net,
          display: net.toFixed(2),
          reason,
        };
      })
      .sort((a, b) => b.score - a.score),
  }),
};
