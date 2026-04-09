import type { PlayerScore, TeamResult, BracketData, BracketGame } from '../types';
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

function getRound(bracketId: number): number {
  if (bracketId >= 700) return 7;
  if (bracketId >= 600) return 6;
  if (bracketId >= 500) return 5;
  if (bracketId >= 400) return 4;
  if (bracketId >= 300) return 3;
  if (bracketId >= 200) return 2;
  return 1;
}

/**
 * Build a bracket tree and map alive teams to their current positions.
 * Uses victorBracketPositionId to link child games to parent games.
 */
function buildBracketTree(games: BracketGame[]) {
  // children: parentBracketId -> child bracketIds (the two games whose winners feed in)
  const children = new Map<number, number[]>();
  const allIds = new Set<number>();
  const hasParent = new Set<number>();

  for (const game of games) {
    if (game.sectionId === 1) continue; // skip First Four
    allIds.add(game.bracketId);
    if (!children.has(game.bracketId)) {
      children.set(game.bracketId, []);
    }

    if (game.victorBracketPositionId) {
      if (!children.has(game.victorBracketPositionId)) {
        children.set(game.victorBracketPositionId, []);
      }
      children.get(game.victorBracketPositionId)!.push(game.bracketId);
      hasParent.add(game.bracketId);
    }
  }

  // Root = highest-round game with no parent (championship)
  let root = 0;
  for (const id of allIds) {
    if (!hasParent.has(id) && getRound(id) >= getRound(root)) {
      root = id;
    }
  }

  // Map each alive team to its next upcoming game (not yet final).
  // Teams whose last game is Final (e.g., the champion) have no future games.
  const gameStateByBracketId = new Map<number, string>();
  for (const game of games) {
    if (game.sectionId === 1) continue;
    gameStateByBracketId.set(game.bracketId, game.gameState);
  }

  const teamPositions = new Map<string, number>();
  for (const game of games) {
    if (game.sectionId === 1) continue;
    if (game.gameState === 'F') continue; // skip finished games
    for (const team of game.teams) {
      if (!team.seoname) continue;
      const curr = teamPositions.get(team.seoname);
      if (!curr || getRound(game.bracketId) > getRound(curr) ||
          (getRound(game.bracketId) === getRound(curr) && game.bracketId > curr)) {
        teamPositions.set(team.seoname, game.bracketId);
      }
    }
  }

  return { children, root, teamPositions };
}

/**
 * Bottom-up DP on the bracket tree to compute the maximum future wins
 * a player can earn, accounting for bracket collisions (two of the player's
 * teams can't both advance past a shared matchup).
 *
 * Returns { wins, canAdvance }:
 * - wins: max future wins earnable by this player's teams at/below this game
 * - canAdvance: whether a player's team can win this game and continue upward
 */
function computeMaxFutureWins(
  gameId: number,
  children: Map<number, number[]>,
  playerPositions: Set<number>,
): { wins: number; canAdvance: boolean } {
  const childIds = children.get(gameId) || [];
  const hasTeamHere = playerPositions.has(gameId);

  if (childIds.length === 0) {
    // Leaf node (Round of 64 game)
    // If the player has a team here, it can win this game (+1) and advance
    return hasTeamHere ? { wins: 1, canAdvance: true } : { wins: 0, canAdvance: false };
  }

  // Recurse into child (feeder) games
  const results = childIds.map(cid => computeMaxFutureWins(cid, children, playerPositions));
  const totalChildWins = results.reduce((s, r) => s + r.wins, 0);

  if (hasTeamHere) {
    // Player's team is already at this game (won through feeder games).
    // It can win this game (+1) and advance. Child subtrees may contain
    // other player teams earning wins in lower rounds.
    return { wins: totalChildWins + 1, canAdvance: true };
  }

  // Can a team from a child subtree advance to win this game?
  const anyAdvances = results.some(r => r.canAdvance);
  if (anyAdvances) {
    // One team wins this game (+1). If BOTH sides have advancing teams,
    // they collide here — both earn their subtree wins, but only one
    // wins this game and continues.
    return { wins: totalChildWins + 1, canAdvance: true };
  }

  return { wins: totalChildWins, canAdvance: false };
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
    if (game.sectionId === 1) continue;
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

  // Build bracket tree for bracket-aware max potential
  const { children, root, teamPositions } = buildBracketTree(data.games);
  const hasBracketTree = root > 0 && children.size > 0;

  // Compute per-player scores
  return players.map(player => {
    let points = 0;
    let teamsAlive = 0;
    let teamsEliminated = 0;
    const teamResults: TeamResult[] = [];
    const aliveTeamSeonames: string[] = [];

    for (const teamName of player.teams) {
      let record: TeamRecord | undefined;
      for (const r of records.values()) {
        if (r.draftName === teamName) {
          record = r;
          break;
        }
      }

      if (record) {
        points += record.wins;
        if (record.alive) {
          teamsAlive++;
          aliveTeamSeonames.push(record.seoname);
        }
        if (record.eliminated) teamsEliminated++;

        const maxTotalWins = 6;
        const remainingWins = record.eliminated ? 0 : Math.max(0, maxTotalWins - record.wins);
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

    // Compute max potential using bracket-aware DP if tree is available
    let maxPotential: number;
    if (hasBracketTree && aliveTeamSeonames.length > 0) {
      // Build set of bracket positions where this player has alive teams
      const playerPositions = new Set<number>();
      for (const seo of aliveTeamSeonames) {
        const pos = teamPositions.get(seo);
        if (pos) playerPositions.add(pos);
      }

      const futureWins = computeMaxFutureWins(root, children, playerPositions);
      maxPotential = points + futureWins.wins;
    } else {
      // Fallback: naive calculation
      maxPotential = teamResults.reduce((sum, t) => sum + t.wins + t.maxRemainingWins, 0);
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
