import type { DraftTeam } from '../types';

/**
 * Input to every advisor algorithm: the pool of teams still available to draft
 * and the teams the current picker already owns.
 */
export interface AlgorithmInput {
  available: DraftTeam[];
  owned: DraftTeam[];
}

/**
 * A single team's ranking within one algorithm.
 *
 * `score` is only comparable within the same algorithm (different algos use
 * different units — win expectation, probability, penalty sum, etc).
 */
export interface TeamScore {
  team: DraftTeam;
  score: number;
  display: string;
  reason: string;
}

export interface AlgorithmResult {
  algorithmId: string;
  ranked: TeamScore[];
}

export interface AlgorithmDef {
  id: string;
  name: string;
  /** 3-4 char label shown on the chip in the UI. */
  short: string;
  /** Long description shown in the chip tooltip. */
  description: string;
  run: (input: AlgorithmInput) => AlgorithmResult;
}
