export interface EdgeTeam {
  id: string; name: string; seed: number; region: string; srs: number;
  expectedWins: number; seedBaseline: number; advance: number[];
}
export interface Snapshot {
  season: number; status: string; trainedThrough: number; regularSeasonLastDay: number;
  model: string; coefficients: number[]; probabilities: number[][]; teams: EdgeTeam[];
}
export const playerForPick = (pick: number) => Math.floor(pick / 8) % 2 === 0 ? pick % 8 : 7 - pick % 8;
export function random(seed: number) {
  let value = seed >>> 0;
  return () => { value = (1664525 * value + 1013904223) >>> 0; return value / 4294967296; };
}
export function advancement(p: number[][]): number[][] {
  let reach = Array(64).fill(1) as number[];
  const result: number[][] = Array.from({ length: 64 }, () => []);
  for (let round = 0; round < 6; round++) {
    const width = 2 ** round;
    reach = reach.map((r, i) => {
      const other = ((Math.floor(i / width)) ^ 1) * width;
      let sum = 0;
      for (let j = other; j < other + width; j++) sum += reach[j] * p[i][j];
      return r * sum;
    });
    reach.forEach((r, i) => result[i].push(r));
  }
  return result;
}
export function validateSnapshot(value: unknown): Snapshot {
  const s = value as Snapshot;
  if (!s || !Number.isInteger(s.season) || !['forecast', 'historical'].includes(s.status)
      || !Number.isInteger(s.trainedThrough) || s.trainedThrough >= s.season
      || !Number.isInteger(s.regularSeasonLastDay) || s.regularSeasonLastDay > 132
      || s.regularSeasonLastDay < 120 || typeof s.model !== 'string'
      || !Array.isArray(s.teams) || s.teams.length !== 64
      || !Array.isArray(s.probabilities) || s.probabilities.length !== 64) {
    throw new Error('Expected a complete 64-team forecast with pre-tournament training and season metadata.');
  }
  const ids = new Set<string>();
  s.teams.forEach((t, i) => {
    if (!t || typeof t.id !== 'string' || !t.id || ids.has(t.id) || typeof t.name !== 'string'
        || typeof t.region !== 'string' || !Number.isInteger(t.seed) || t.seed < 1 || t.seed > 16
        || !Number.isFinite(t.srs) || !Number.isFinite(t.seedBaseline)
        || t.seedBaseline < 0 || t.seedBaseline > 6
        || !Array.isArray(s.probabilities[i]) || s.probabilities[i].length !== 64) {
      throw new Error('Invalid or duplicate team, seed, or matchup matrix.');
    }
    ids.add(t.id);
  });
  for (let i = 0; i < 64; i++) for (let j = 0; j < 64; j++) {
    const p = s.probabilities[i][j];
    if (!Number.isFinite(p) || p < 0 || p > 1 || Math.abs(p + s.probabilities[j][i] - 1) > 1e-5) {
      throw new Error('Matchup probabilities must be finite, between 0 and 1, and complementary.');
    }
  }
  const order = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];
  const regions = new Set<string>();
  for (let start = 0; start < 64; start += 16) {
    const group = s.teams.slice(start, start + 16);
    if (regions.has(group[0].region) || group.some(t => t.region !== group[0].region)
        || new Set(group.map(t => t.seed)).size !== 16) {
      throw new Error('Teams must follow official bracket-tree order, with Final Four opponents in adjacent regions.');
    }
    // Official slots can flip either child. Validate matchup sets, not visual orientation.
    for (const width of [2, 4, 8]) {
      const valid = new Set(Array.from({ length: 16 / width }, (_, i) => order.slice(i * width, (i + 1) * width).sort((a,b)=>a-b).join(',')));
      for (let i = 0; i < 16; i += width) {
        if (!valid.has(group.slice(i, i + width).map(t=>t.seed).sort((a,b)=>a-b).join(','))) {
          throw new Error('Invalid bracket matchups within a region.');
        }
      }
    }
    regions.add(group[0].region);
  }
  // Derive EV and round probabilities; do not trust imported display values.
  const advances = advancement(s.probabilities);
  return { ...s, teams: s.teams.map((t, i) => ({ ...t, advance: advances[i], expectedWins: advances[i].reduce((a, b) => a + b, 0) })) };
}
export function simulate(s: Snapshot, count = 4000, seed = 20270318) {
  const rng = random(seed);
  return Array.from({ length: count }, () => {
    const wins = new Uint8Array(64);
    let alive = Array.from({ length: 64 }, (_, i) => i);
    while (alive.length > 1) {
      const next: number[] = [];
      for (let i = 0; i < alive.length; i += 2) {
        const a = alive[i], b = alive[i + 1];
        const winner = rng() < s.probabilities[a][b] ? a : b;
        wins[winner]++;
        next.push(winner);
      }
      alive = next;
    }
    return wins;
  });
}
export function validPicks(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= 64 && new Set(value).size === value.length
    && value.every(x => Number.isInteger(x) && x >= 0 && x < 64);
}
export interface Recommendation { index: number; winShare: number; points: number; nextBest: string | null }
export function recommend(s: Snapshot, picks: number[], seat: number, opponents: 'seed' | 'ev', samples: Uint8Array[]): Recommendation[] {
  if (!validPicks(picks)) throw new Error('Invalid draft picks');
  if (!Number.isInteger(seat) || seat < 0 || seat > 7) throw new Error('Invalid seat');
  if (picks.length === 64 || playerForPick(picks.length) !== seat) return [];
  const available = s.teams.map((_, i) => i).filter(i => !picks.includes(i));
  const modelRank = [...available].sort((a, b) => s.teams[b].expectedWins - s.teams[a].expectedWins || a - b);
  const opponentRank = [...available].sort((a, b) => opponents === 'seed'
    ? s.teams[a].seed - s.teams[b].seed || a - b
    : s.teams[b].expectedWins - s.teams[a].expectedWins || a - b);
  return available.map(candidate => {
    const projected = [...picks, candidate];
    const taken = new Set(projected);
    let nextBest: string | null = null;
    while (projected.length < 64) {
      const owner = playerForPick(projected.length);
      const rank = owner === seat ? modelRank : opponentRank;
      const team = rank.find(t => !taken.has(t))!;
      if (owner === seat && nextBest === null) nextBest = s.teams[team].name;
      projected.push(team); taken.add(team);
    }
    const rosters: number[][] = Array.from({ length: 8 }, () => []);
    projected.forEach((t, pick) => rosters[playerForPick(pick)].push(t));
    let share = 0, points = 0;
    for (const wins of samples) {
      const scores = rosters.map(r => r.reduce((sum, t) => sum + wins[t], 0));
      const high = Math.max(...scores);
      if (scores[seat] === high) share += 1 / scores.filter(x => x === high).length;
      points += scores[seat];
    }
    return { index: candidate, winShare: share / samples.length, points: points / samples.length, nextBest };
  });
}
