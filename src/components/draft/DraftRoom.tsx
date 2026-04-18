import { useState } from 'react';
import { useDraft } from '../../hooks/useDraft';
import { slotForPick, upcomingPickers } from '../../utils/draftOrder';
import { draftTeams } from '../../data/draftTeams';
import { OnTheClock } from './OnTheClock';
import { DraftOrder } from './DraftOrder';
import { AvailableTeams } from './AvailableTeams';
import { DraftBoard } from './DraftBoard';
import { RosterPanel } from './RosterPanel';
import { DraftComplete } from './DraftComplete';

type SidePanel = 'board' | 'rosters';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0f0f16] p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h4 className="font-['Anybody'] text-lg font-black uppercase tracking-wider text-white">
          {title}
        </h4>
        <p className="mt-2 font-['DM_Sans'] text-sm text-white/60">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/[0.08] bg-transparent px-3 py-1.5 font-['DM_Sans'] text-xs font-semibold text-white/60 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 font-['DM_Sans'] text-xs font-bold transition-colors ${
              danger
                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'bg-amber-400 text-black hover:bg-amber-300'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DraftRoom() {
  const {
    state,
    currentPickNumber,
    currentPicker,
    availableTeams,
    rosters,
    isComplete,
    canUndo,
    makePick,
    undo,
    reset,
  } = useDraft();

  const [panel, setPanel] = useState<SidePanel>('board');
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const clampedPick = isComplete ? state.totalPicks : currentPickNumber;
  const slot = slotForPick(clampedPick, state.players.length);
  const upcoming = upcomingPickers(clampedPick, state.players, state.totalPicks, 3);

  return (
    <div className="animate-[fadeSlideIn_0.35s_ease-out_both] space-y-4 px-4 py-5 sm:px-6 sm:py-6">
      {isComplete ? (
        <DraftComplete
          players={state.players}
          rosters={rosters}
          teamsPerPlayer={state.teamsPerPlayer}
          onReset={() => setConfirmReset(true)}
        />
      ) : (
        currentPicker && (
          <OnTheClock
            picker={currentPicker}
            pickNumber={currentPickNumber}
            totalPicks={state.totalPicks}
            round={slot.round}
            pickInRound={slot.pickInRound}
            upcoming={upcoming}
          />
        )
      )}

      {!isComplete && (
        <DraftOrder
          players={state.players}
          round={slot.round}
          pickInRound={slot.pickInRound}
          totalPicks={state.totalPicks}
          totalPicksMade={state.picks.length}
        />
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <div className="flex items-center gap-2 font-['DM_Sans'] text-[11px] text-white/40">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Progress auto-saves to this device
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setConfirmUndo(true)}
            disabled={!canUndo}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 font-['DM_Sans'] text-[11px] font-semibold text-white/60 transition-colors hover:border-white/[0.15] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/[0.06]"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h13a5 5 0 010 10h-3M3 10l4-4M3 10l4 4" />
            </svg>
            Undo
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            disabled={state.picks.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 font-['DM_Sans'] text-[11px] font-semibold text-white/50 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/[0.06] disabled:hover:text-white/50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main grid */}
      {!isComplete && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <AvailableTeams
            teams={availableTeams}
            totalTeams={draftTeams.length}
            picker={currentPicker}
            onPick={makePick}
          />

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
            <div className="mb-3 flex gap-1">
              {(['board', 'rosters'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPanel(p)}
                  className={`rounded-md px-3 py-1 font-['DM_Sans'] text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    panel === p
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {p === 'board' ? 'Board' : 'Rosters'}
                </button>
              ))}
            </div>
            {panel === 'board' ? (
              <DraftBoard picks={state.picks} players={state.players} />
            ) : (
              <RosterPanel
                players={state.players}
                rosters={rosters}
                teamsPerPlayer={state.teamsPerPlayer}
                currentPickerName={currentPicker?.name}
              />
            )}
          </div>
        </div>
      )}

      {/* When complete, show full rosters underneath */}
      {isComplete && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
          <RosterPanel
            players={state.players}
            rosters={rosters}
            teamsPerPlayer={state.teamsPerPlayer}
          />
        </div>
      )}

      {confirmUndo && (
        <ConfirmDialog
          title="Undo last pick?"
          message={`This will remove pick #${state.picks.length} and put ${
            state.picks[state.picks.length - 1]?.playerName ?? 'the last picker'
          } back on the clock.`}
          confirmLabel="Undo pick"
          onConfirm={() => { undo(); setConfirmUndo(false); }}
          onCancel={() => setConfirmUndo(false)}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          title="Reset the entire draft?"
          message="All picks will be cleared. This can't be undone."
          confirmLabel="Reset draft"
          danger
          onConfirm={() => { reset(); setConfirmReset(false); }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
