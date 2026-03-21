import type { Player } from '../types';

export const players: Player[] = [
  {
    name: 'Jack',
    teams: ['Arizona', 'Michigan State', 'Alabama', 'Iowa', 'Georgia', 'USF', 'Cal Baptist', 'LIU'],
    color: 'red',
    colorHex: '#ef4444',
  },
  {
    name: 'Ben',
    teams: ['Michigan', 'Wisconsin', 'Vanderbilt', 'TCU', 'Clemson', 'Santa Clara', 'Hawaii', 'Siena'],
    color: 'blue',
    colorHex: '#3b82f6',
  },
  {
    name: 'Connor',
    teams: ['Duke', 'Nebraska', 'Texas Tech', 'Villanova', 'UCF', 'Texas', 'Penn', 'Prairie View A&M'],
    color: 'emerald',
    colorHex: '#10b981',
  },
  {
    name: 'Taylor',
    teams: ['Florida', 'Arkansas', 'Tennessee', 'Ohio State', 'St. Louis', 'Texas A&M', 'Troy', 'Queens'],
    color: 'amber',
    colorHex: '#fbbf24',
  },
  {
    name: 'Will',
    teams: ['Houston', 'Kansas', 'BYU', 'Kentucky', 'Missouri', 'McNeese', 'High Point', 'Howard'],
    color: 'violet',
    colorHex: '#8b5cf6',
  },
  {
    name: 'Coby',
    teams: ['Purdue', 'Illinois', "St. John's", 'UCLA', 'Utah State', 'VCU', 'Kennesaw St', 'Wright St'],
    color: 'orange',
    colorHex: '#f97316',
  },
  {
    name: 'Peter',
    teams: ['UConn', 'Virginia', 'North Carolina', 'Miami', 'Hofstra', 'Northern Iowa', 'Idaho', 'Tennessee St'],
    color: 'cyan',
    colorHex: '#22d3ee',
  },
  {
    name: 'Chris',
    teams: ['Iowa St', 'Gonzaga', 'Louisville', "Saint Mary's", 'Miami (OH)', 'Akron', 'NDSU', 'Furman'],
    color: 'pink',
    colorHex: '#ec4899',
  },
];

export const playersByTeam: Record<string, Player> = {};
for (const player of players) {
  for (const team of player.teams) {
    playersByTeam[team] = player;
  }
}
