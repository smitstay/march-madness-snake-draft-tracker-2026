/**
 * Advisor — roster-aware draft recommendations.
 *
 * Algorithm taxonomy mirrors the "Group N · #M" menu discussed in planning.
 * Current implementations:
 *
 *   algorithms/historicalSeedEv.ts              · Group 1 · #2
 *   algorithms/collisionAdjustedSeedMarkov.ts   · Group 2 · #5
 *   algorithms/rosterDiversifier.ts             · Group 2 · #7
 *   algorithms/ceilingPick.ts                   · Group 4 · #11
 *   classicUpsetSpotlight.ts                    · Group 3 · #8   (overlay helper)
 *   agreementScore.ts                           · Group 6 · #18  (meta over results)
 *
 * Each algorithm lives in its own file and implements the `AlgorithmDef`
 * shape from `types.ts`. `registry.ts` wires them up in the order they
 * appear in the UI. To add a new algorithm:
 *
 *   1. Drop a new file in `algorithms/` exporting an `AlgorithmDef`.
 *   2. Re-export from `algorithms/index.ts`.
 *   3. Add it to the `ALGORITHMS` array in `registry.ts`.
 *
 * Scoring data (historical seed reach rates, R1 pairings, upset slots) is
 * kept in `src/data/seedStats.ts` and imported as needed.
 */
export { ALGORITHMS, runAll } from './registry';
export { computeAgreementScore } from './agreementScore';
export { upsetInfo } from './classicUpsetSpotlight';
export { earliestMeetingRound } from './bracketGeometry';
export type {
  AlgorithmDef,
  AlgorithmInput,
  AlgorithmResult,
  TeamScore,
} from './types';
