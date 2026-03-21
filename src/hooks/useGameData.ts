import { useState, useEffect, useCallback, useRef } from 'react';
import type { BracketData, PlayerScore } from '../types';
import { fetchBracketData, getCachedBracket, cacheBracket, hasLiveGames } from '../api/ncaa';
import { computeAllScores, sortScores } from '../utils/scoring';

interface GameDataState {
  bracket: BracketData | null;
  scores: PlayerScore[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isLive: boolean;
}

const POLL_ACTIVE = 30_000;   // 30s when games are live
const POLL_IDLE = 300_000;    // 5min when no games

export function useGameData(): GameDataState & { refresh: () => void } {
  const [state, setState] = useState<GameDataState>(() => {
    // Try loading from cache on init
    const cached = getCachedBracket();
    if (cached) {
      const scores = sortScores(computeAllScores(cached));
      return {
        bracket: cached,
        scores,
        loading: true, // still fetch fresh data
        error: null,
        lastUpdated: null,
        isLive: hasLiveGames(cached),
      };
    }
    return {
      bracket: null,
      scores: [],
      loading: true,
      error: null,
      lastUpdated: null,
      isLive: false,
    };
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const processData = useCallback((data: BracketData) => {
    const scores = sortScores(computeAllScores(data));
    const isLive = hasLiveGames(data);
    cacheBracket(data);
    setState({
      bracket: data,
      scores,
      loading: false,
      error: null,
      lastUpdated: new Date(),
      isLive,
    });
    return isLive;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchBracketData();
      const isLive = processData(data);
      // Adjust poll interval
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchData, isLive ? POLL_ACTIVE : POLL_IDLE);
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: prev.bracket ? null : (err instanceof Error ? err.message : 'Failed to load'),
      }));
    }
  }, [processData]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { ...state, refresh };
}
