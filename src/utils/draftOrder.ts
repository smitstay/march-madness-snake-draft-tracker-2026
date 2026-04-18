import type { DraftPlayer } from '../types';

export interface SnakeSlot {
  pickNumber: number;
  round: number;
  pickInRound: number;
  playerIndex: number;
}

// Compute which player is on the clock for a 1-indexed pick number under snake rules.
// Round 1: player 0 -> N-1, Round 2: player N-1 -> 0, etc.
export function slotForPick(pickNumber: number, numPlayers: number): SnakeSlot {
  const round = Math.floor((pickNumber - 1) / numPlayers) + 1;
  const indexInRound = (pickNumber - 1) % numPlayers;
  const isEvenRound = round % 2 === 0;
  const playerIndex = isEvenRound ? numPlayers - 1 - indexInRound : indexInRound;
  return {
    pickNumber,
    round,
    pickInRound: indexInRound + 1,
    playerIndex,
  };
}

export function currentPicker(
  pickNumber: number,
  players: DraftPlayer[],
): DraftPlayer | null {
  if (pickNumber < 1) return null;
  const { playerIndex } = slotForPick(pickNumber, players.length);
  return players[playerIndex] ?? null;
}

export function upcomingPickers(
  pickNumber: number,
  players: DraftPlayer[],
  totalPicks: number,
  count: number,
): DraftPlayer[] {
  const out: DraftPlayer[] = [];
  for (let p = pickNumber + 1; p <= totalPicks && out.length < count; p++) {
    const { playerIndex } = slotForPick(p, players.length);
    const picker = players[playerIndex];
    if (picker) out.push(picker);
  }
  return out;
}

// Returns the round's sequence of player indices in the order they pick this round.
export function roundOrder(round: number, numPlayers: number): number[] {
  const base = Array.from({ length: numPlayers }, (_, i) => i);
  return round % 2 === 0 ? [...base].reverse() : base;
}
