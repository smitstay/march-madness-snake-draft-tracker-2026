import { useState, useEffect, useCallback } from 'react';
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

const POLL_INTERVAL = 30_000; // Always poll every 30s

export function useGameData(): GameDataState & { refresh: () => void } {
  const [state, setState] = useState<GameDataState>(() => {
    const cached = getCachedBracket();
    if (cached) {
      const scores = sortScores(computeAllScores(cached));
      return {
        bracket: cached,
        scores,
        loading: true,
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

  const doFetch = useCallback(async () => {
    try {
      const data = await fetchBracketData();
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
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: prev.bracket ? null : (err instanceof Error ? err.message : 'Failed to load'),
      }));
    }
  }, []);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    doFetch();
  }, [doFetch]);

  useEffect(() => {
    doFetch();
    const id = setInterval(doFetch, POLL_INTERVAL);
    const onVisible = () => {
      if (document.visibilityState === 'visible') doFetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [doFetch]);

  return { ...state, refresh };
}
