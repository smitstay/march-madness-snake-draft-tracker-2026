import {
  ceilingPickAlgo,
  collisionAdjustedSeedMarkovAlgo,
  historicalSeedEvAlgo,
  rosterDiversifierAlgo,
} from './algorithms';
import type { AlgorithmDef, AlgorithmInput, AlgorithmResult } from './types';

/**
 * The order here is the order chips appear in the UI. First entry is the
 * default primary sort.
 */
export const ALGORITHMS: AlgorithmDef[] = [
  collisionAdjustedSeedMarkovAlgo,
  historicalSeedEvAlgo,
  rosterDiversifierAlgo,
  ceilingPickAlgo,
];

export function runAll(input: AlgorithmInput): AlgorithmResult[] {
  return ALGORITHMS.map(a => a.run(input));
}
