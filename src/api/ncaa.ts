import type { BracketData, BracketGame, BracketTeam, BracketRegion, BracketRound } from '../types';

const BRACKET_PATH = '/brackets/basketball-men/d1/2026';

// In dev, use Vite proxy to avoid CORS. In prod, use corsproxy.io as fallback.
function getBracketUrls(): string[] {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    return [`/api/ncaa${BRACKET_PATH}`];
  }
  return [
    `https://ncaa-api.henrygd.me${BRACKET_PATH}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://ncaa-api.henrygd.me${BRACKET_PATH}`)}`,
  ];
}
const CACHE_KEY = 'ncaa_bracket_data';
const CACHE_TS_KEY = 'ncaa_bracket_ts';

function decodeHtml(s: string): string {
  return s.replace(/&#174;/g, '®').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function normalizeTeam(raw: any): BracketTeam {
  return {
    seoname: raw?.seoname || '',
    nameShort: raw?.nameShort || '',
    nameFull: raw?.nameFull || '',
    seed: raw?.seed || 0,
    score: raw?.score ?? null,
    isWinner: raw?.isWinner === true,
    isTop: raw?.isTop === true,
    logoUrl: raw?.logoUrl || '',
  };
}

function normalizeGame(raw: any): BracketGame {
  return {
    contestId: raw.contestId,
    bracketId: raw.bracketId,
    sectionId: raw.sectionId,
    gameState: raw.gameState === 'F' ? 'F' : raw.gameState === 'I' ? 'I' : 'P',
    currentPeriod: raw.currentPeriod || '',
    contestClock: raw.contestClock || '',
    startDate: raw.startDate || '',
    startTime: raw.startTime || '',
    teams: (raw.teams || []).map(normalizeTeam),
    victorBracketPositionId: raw.victorBracketPositionId || null,
  };
}

function normalizeRegion(raw: any): BracketRegion {
  return {
    sectionId: raw.sectionId,
    name: (raw.title || '').trim(),
    abbreviation: (raw.abbreviation || '').trim(),
    regionCode: raw.regionCode || '',
  };
}

function normalizeRound(raw: any): BracketRound {
  return {
    roundNumber: raw.roundNumber,
    title: decodeHtml(raw.title || ''),
    label: raw.label || '',
    subtitle: raw.subtitle || '',
  };
}

export async function fetchBracketData(): Promise<BracketData> {
  const urls = getBracketUrls();
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': '*/*' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const champ = data?.championships?.[0];
      if (!champ) {
        lastError = new Error('No championship data');
        continue;
      }

      return {
        games: (champ.games || []).map(normalizeGame),
        regions: (champ.regions || []).map(normalizeRegion),
        rounds: (champ.rounds || []).map(normalizeRound),
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Fetch failed');
      continue;
    }
  }

  throw lastError || new Error('All fetch attempts failed');
}

export function getCachedBracket(): BracketData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function cacheBracket(data: BracketData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
  } catch {}
}

export function hasLiveGames(data: BracketData): boolean {
  return data.games.some(g => g.gameState === 'I');
}
