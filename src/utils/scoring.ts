import type { PlayerScore, TeamResult, BracketData } from '../types';
import { players } from '../data/picks';
import { slugToTeam } from '../data/teamAliases';

interface TeamRecord {
  draftName: string;
  seoname: string;
  seed: number;
  wins: number;
  eliminated: boolean;
  alive: boolean;
}

export function computeAllScores(data: BracketData): PlayerScore[] {
  // Build per-team win/loss records from all games
  const records = new Map<string, TeamRecord>();

  function ensureRecord(seo: string, nameShort: string, seed: number) {
    if (!seo || records.has(seo)) return;
    const draftName = slugToTeam[seo] || nameShort;
    records.set(seo, {
      draftName,
      seoname: seo,
      seed,
      wins: 0,
      eliminated: false,
      alive: true,
    });
  }

  for (const game of data.games) {
    if (game.teams.length < 2) continue;
    const [t0, t1] = game.teams;
    if (t0.seoname) ensureRecord(t0.seoname, t0.nameShort, t0.seed);
    if (t1.seoname) ensureRecord(t1.seoname, t1.nameShort, t1.seed);

    if (game.gameState === 'F') {
      const winner = game.teams.find(t => t.isWinner);
      const loser = game.teams.find(t => !t.isWinner);
      if (winner?.seoname && records.has(winner.seoname)) {
        records.get(winner.seoname)!.wins++;
      }
      if (loser?.seoname && records.has(loser.seoname)) {
        records.get(loser.seoname)!.eliminated = true;
        records.get(loser.seoname)!.alive = false;
      }
    }
  }

  // Compute per-player scores
  return players.map(player => {
    let points = 0;
    let maxPotential = 0;
    let teamsAlive = 0;
    let teamsEliminated = 0;
    const teamResults: TeamResult[] = [];

    for (const teamName of player.teams) {
      // Find the record by matching draft name
      let record: TeamRecord | undefined;
      for (const r of records.values()) {
        if (r.draftName === teamName) {
          record = r;
          break;
        }
      }

      if (record) {
        points += record.wins;
        // Max remaining wins: a team in the main bracket can win up to 6 games total
        // First Four teams can win 7 total (1 play-in + 6 main)
        const maxTotalWins = 7; // conservative max
        const remainingWins = record.eliminated ? 0 : Math.max(0, maxTotalWins - record.wins);
        maxPotential += record.wins + remainingWins;
        if (record.alive) teamsAlive++;
        if (record.eliminated) teamsEliminated++;
        teamResults.push({
          teamName,
          seoname: record.seoname,
          seed: record.seed,
          wins: record.wins,
          alive: record.alive,
          eliminated: record.eliminated,
          owner: player,
          maxRemainingWins: remainingWins,
        });
      } else {
        // Team not found in bracket data (might not have made tournament)
        teamResults.push({
          teamName,
          seoname: '',
          seed: 0,
          wins: 0,
          alive: false,
          eliminated: true,
          owner: player,
          maxRemainingWins: 0,
        });
        teamsEliminated++;
      }
    }

    return { player, points, maxPotential, teamsAlive, teamsEliminated, teamResults };
  });
}

export function sortScores(scores: PlayerScore[]): PlayerScore[] {
  return [...scores].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.maxPotential !== a.maxPotential) return b.maxPotential - a.maxPotential;
    return b.teamsAlive - a.teamsAlive;
  });
}
