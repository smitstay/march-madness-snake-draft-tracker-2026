import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DraftPick, DraftPlayer, DraftState, DraftTeam } from '../types';
import { defaultDraftPlayers, draftTeams } from '../data/draftTeams';
import { slotForPick } from '../utils/draftOrder';

const STORAGE_KEY = 'mm-draft-2027-v1';

function initialState(): DraftState {
  const players = defaultDraftPlayers;
  return {
    players,
    picks: [],
    totalPicks: 64,
    teamsPerPlayer: 8,
  };
}

function load(): DraftState {
  if (typeof window === 'undefined') return initialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as DraftState;
    if (!parsed?.players?.length) return initialState();
    return parsed;
  } catch {
    return initialState();
  }
}

export interface UseDraftResult {
  state: DraftState;
  currentPickNumber: number;
  currentPicker: DraftPlayer | null;
  availableTeams: DraftTeam[];
  draftedTeamIds: Set<string>;
  rosters: Record<string, DraftPick[]>;
  isComplete: boolean;
  canUndo: boolean;
  makePick: (team: DraftTeam) => void;
  undo: () => void;
  reset: () => void;
}

export function useDraft(): UseDraftResult {
  const [state, setState] = useState<DraftState>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full / disabled — silently ignore
    }
  }, [state]);

  const currentPickNumber = state.picks.length + 1;
  const isComplete = state.picks.length >= state.totalPicks;

  const draftedTeamIds = useMemo(
    () => new Set(state.picks.map(p => p.team.id)),
    [state.picks],
  );

  const availableTeams = useMemo(
    () => draftTeams.filter(t => !draftedTeamIds.has(t.id)),
    [draftedTeamIds],
  );

  const currentPickerValue = useMemo(() => {
    if (isComplete) return null;
    const slot = slotForPick(currentPickNumber, state.players.length);
    return state.players[slot.playerIndex] ?? null;
  }, [currentPickNumber, isComplete, state.players]);

  const rosters = useMemo(() => {
    const map: Record<string, DraftPick[]> = {};
    for (const player of state.players) map[player.name] = [];
    for (const pick of state.picks) {
      (map[pick.playerName] ||= []).push(pick);
    }
    return map;
  }, [state.picks, state.players]);

  const makePick = useCallback(
    (team: DraftTeam) => {
      setState(prev => {
        if (prev.picks.length >= prev.totalPicks) return prev;
        if (prev.picks.some(p => p.team.id === team.id)) return prev;
        const pickNumber = prev.picks.length + 1;
        const slot = slotForPick(pickNumber, prev.players.length);
        const picker = prev.players[slot.playerIndex];
        if (!picker) return prev;
        const pick: DraftPick = {
          pickNumber,
          round: slot.round,
          pickInRound: slot.pickInRound,
          playerName: picker.name,
          team,
          timestamp: Date.now(),
        };
        return { ...prev, picks: [...prev.picks, pick] };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setState(prev => ({ ...prev, picks: prev.picks.slice(0, -1) }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({ ...prev, picks: [] }));
  }, []);

  return {
    state,
    currentPickNumber,
    currentPicker: currentPickerValue,
    availableTeams,
    draftedTeamIds,
    rosters,
    isComplete,
    canUndo: state.picks.length > 0,
    makePick,
    undo,
    reset,
  };
}
