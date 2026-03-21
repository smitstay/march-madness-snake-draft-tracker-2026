import type { BracketTeam } from '../types';
import type { Player } from '../types';
import { playersByTeam } from '../data/picks';
import { findDraftName } from '../data/teamAliases';

export function getTeamOwner(team: BracketTeam): Player | null {
  const draftName = findDraftName(team.nameShort, team.seoname);
  if (draftName && playersByTeam[draftName]) {
    return playersByTeam[draftName];
  }
  return null;
}

export function getTeamDraftName(team: BracketTeam): string | null {
  return findDraftName(team.nameShort, team.seoname);
}
