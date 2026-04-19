import type { DraftTeam } from '../types';
import {
  expectedRemainingWins,
  expectedWinsForSeed,
  reachProb,
  UPSET_SLOTS,
} from '../data/seedStats';
import { earliestMeetingRound } from './bracketGeometry';

export interface AlgorithmInput {
  available: DraftTeam[];
  owned: DraftTeam[];
}

export interface TeamScore {
  team: DraftTeam;
  score: number;       // higher = better; same units within an algorithm only
  display: string;     // pre-formatted for the UI
  reason: string;      // one-line explanation
}

export interface AlgorithmResult {
  algorithmId: string;
  ranked: TeamScore[]; // sorted desc by score
}

export interface AlgorithmDef {
  id: string;
  name: string;
  short: string;
  description: string;
  run: (input: AlgorithmInput) => AlgorithmResult;
}

// ─── #2 Historical Seed EV ─────────────────────────────────────────────────
const seedEvAlgo: AlgorithmDef = {
  id: 'seedEv',
  name: 'Seed EV',
  short: 'EV',
  description: 'Historical avg tournament wins for each seed since 1985.',
  run: ({ available }) => ({
    algorithmId: 'seedEv',
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

// ─── #11 Ceiling Pick ──────────────────────────────────────────────────────
const ceilingAlgo: AlgorithmDef = {
  id: 'ceiling',
  name: 'Ceiling',
  short: 'CEIL',
  description: 'P(reaches Final Four | wins their R1 game). Best lottery-ticket pick.',
  run: ({ available }) => ({
    algorithmId: 'ceiling',
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

// ─── #7 Roster Diversifier ─────────────────────────────────────────────────
// Penalize early-round collisions with already-owned teams.
const COLLISION_PENALTY: Record<string, number> = {
  R64: 1.0, R32: 0.6, S16: 0.35, E8: 0.2, F4: 0.1, NCG: 0.05, CHAMP: 0,
};

const diversifierAlgo: AlgorithmDef = {
  id: 'diversify',
  name: 'Diversifier',
  short: 'DIV',
  description: 'Avoid stacking the same quadrant/region as your existing roster.',
  run: ({ available, owned }) => ({
    algorithmId: 'diversify',
    ranked: available
      .map(team => {
        let penalty = 0;
        let worst: { round: string; against: string } | null = null;
        for (const u of owned) {
          const round = earliestMeetingRound(team, u);
          if (!round) continue;
          const p = COLLISION_PENALTY[round] ?? 0;
          penalty += p;
          if (!worst || p > (COLLISION_PENALTY[worst.round] ?? 0)) {
            worst = { round, against: u.name };
          }
        }
        const score = -penalty;
        const reason = worst
          ? `${worst.round} collision with ${worst.against}`
          : owned.length > 0
            ? 'No collisions before Final Four'
            : 'Open roster — pure pick';
        return {
          team,
          score,
          display: penalty === 0 ? 'clean' : `−${penalty.toFixed(2)}`,
          reason,
        };
      })
      .sort((a, b) => b.score - a.score),
  }),
};

// ─── #5 Collision-Adjusted Markov ──────────────────────────────────────────
// Marginal expected roster wins from adding team T:
//   standalone EV(T) - Σ_{U in owned} P(T,U meet at R) * min(remEV(T@R), remEV(U@R))
const collisionMarkovAlgo: AlgorithmDef = {
  id: 'collisionEv',
  name: 'Collision-Adj EV',
  short: 'NET',
  description: 'Seed EV minus expected wins lost when this team collides with your roster.',
  run: ({ available, owned }) => ({
    algorithmId: 'collisionEv',
    ranked: available
      .map(team => {
        const standaloneEv = expectedWinsForSeed(team.seed);
        let collisionLoss = 0;
        let worstCollision: { round: string; against: string; loss: number } | null = null;
        for (const u of owned) {
          const round = earliestMeetingRound(team, u);
          if (!round) continue;
          const pTeamReaches = reachProb[team.seed]?.[round] ?? 0;
          const pOwnedReaches = reachProb[u.seed]?.[round] ?? 0;
          const jointMeetingProb = pTeamReaches * pOwnedReaches;
          if (jointMeetingProb <= 0) continue;
          const remTeam = expectedRemainingWins(team.seed, round);
          const remOwned = expectedRemainingWins(u.seed, round);
          // When they meet, exactly one survives. Expected lost wins = min(rem) - 0
          // weighted by joint meeting probability.
          const loss = jointMeetingProb * Math.min(remTeam, remOwned);
          collisionLoss += loss;
          if (!worstCollision || loss > worstCollision.loss) {
            worstCollision = { round, against: u.name, loss };
          }
        }
        const net = standaloneEv - collisionLoss;
        const reason = collisionLoss < 0.01
          ? `${standaloneEv.toFixed(2)} EV · clean`
          : `${standaloneEv.toFixed(2)} EV − ${collisionLoss.toFixed(2)} (worst: ${worstCollision?.round} vs ${worstCollision?.against})`;
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

// ─── Registry ──────────────────────────────────────────────────────────────
export const ALGORITHMS: AlgorithmDef[] = [
  collisionMarkovAlgo,
  seedEvAlgo,
  diversifierAlgo,
  ceilingAlgo,
];

export function runAll(input: AlgorithmInput): AlgorithmResult[] {
  return ALGORITHMS.map(a => a.run(input));
}

// ─── #18 Agreement Score ───────────────────────────────────────────────────
// For each team, count how many of the active algorithms rank it in top-N.
export function computeAgreement(
  results: AlgorithmResult[],
  topN: number,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const result of results) {
    const top = result.ranked.slice(0, topN);
    for (const entry of top) {
      counts.set(entry.team.id, (counts.get(entry.team.id) ?? 0) + 1);
    }
  }
  return counts;
}

// ─── #8 Upset Spotlight (overlay helper) ───────────────────────────────────
export function upsetInfo(team: DraftTeam): { rate: number; label: string } | null {
  const slot = UPSET_SLOTS[team.seed];
  return slot ? { rate: slot.rate, label: slot.label } : null;
}
