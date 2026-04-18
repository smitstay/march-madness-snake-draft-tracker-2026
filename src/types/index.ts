export interface Player {
  name: string;
  teams: string[];
  color: string;
  colorHex: string;
}

export interface BracketTeam {
  seoname: string;
  nameShort: string;
  nameFull: string;
  seed: number;
  score: number | null;
  isWinner: boolean;
  isTop: boolean;
  logoUrl: string;
}

export interface BracketGame {
  contestId: number;
  bracketId: number;
  sectionId: number;
  gameState: 'F' | 'I' | 'P';  // Final, In-progress, Pre
  currentPeriod: string;
  contestClock: string;
  startDate: string;
  startTime: string;
  teams: BracketTeam[];
  victorBracketPositionId: number | null;
}

export interface BracketRegion {
  sectionId: number;
  name: string;
  abbreviation: string;
  regionCode: string;
}

export interface BracketRound {
  roundNumber: number;
  title: string;
  label: string;
  subtitle: string;
}

export interface BracketData {
  games: BracketGame[];
  regions: BracketRegion[];
  rounds: BracketRound[];
}

export interface PlayerScore {
  player: Player;
  points: number;
  maxPotential: number;
  teamsAlive: number;
  teamsEliminated: number;
  teamResults: TeamResult[];
}

export interface TeamResult {
  teamName: string;
  seoname: string;
  seed: number;
  wins: number;
  alive: boolean;
  eliminated: boolean;
  owner: Player;
  maxRemainingWins: number;
}

export type TabType = 'scoreboard' | 'bracket' | 'teams' | 'draft';

export type Region = 'East' | 'West' | 'South' | 'Midwest';

export interface DraftTeam {
  id: string;
  name: string;
  seed: number;
  region: Region;
  record?: string;
}

export interface DraftPlayer {
  name: string;
  colorHex: string;
}

export interface DraftPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  playerName: string;
  team: DraftTeam;
  timestamp: number;
}

export interface DraftState {
  players: DraftPlayer[];
  picks: DraftPick[];
  totalPicks: number;
  teamsPerPlayer: number;
}
