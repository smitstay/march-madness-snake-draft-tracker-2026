import type { AlgorithmResult } from './types';

/**
 * #18 · Agreement Score.
 *
 * For each team, count how many of the given algorithm results rank it in
 * their top N. Teams that multiple algorithms independently favor are
 * "consensus picks" and get a higher agreement count.
 */
export function computeAgreementScore(
  results: AlgorithmResult[],
  topN: number,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const result of results) {
    for (const entry of result.ranked.slice(0, topN)) {
      counts.set(entry.team.id, (counts.get(entry.team.id) ?? 0) + 1);
    }
  }
  return counts;
}
