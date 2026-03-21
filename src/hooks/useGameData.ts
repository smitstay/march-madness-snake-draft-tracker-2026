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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLiveRef = useRef(false);

  const doFetch = useCallback(async () => {
    try {
      const data = await fetchBracketData();
      const scores = sortScores(computeAllScores(data));
      const isLive = hasLiveGames(data);
      isLiveRef.current = isLive;
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

  // Single stable effect: fetch on mount, set up polling, re-fetch on tab focus
  useEffect(() => {
    // Initial fetch
    doFetch();

    // Polling interval — checks isLiveRef to pick the right interval
    function startPoll() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        doFetch();
        // Re-adjust interval if live state changed
        const currentInterval = isLiveRef.current ? POLL_ACTIVE : POLL_IDLE;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(doFetch, currentInterval);
        }
      }, isLiveRef.current ? POLL_ACTIVE : POLL_IDLE);
    }
    startPoll();

    // Re-fetch when user returns to the tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        doFetch();
        startPoll(); // restart poll with fresh interval
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [doFetch]);

  return { ...state, refresh };
}
