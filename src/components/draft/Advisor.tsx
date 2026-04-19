import { useMemo, useState } from 'react';
import type { DraftPlayer, DraftTeam } from '../../types';
import {
  ALGORITHMS,
  computeAgreement,
  runAll,
  upsetInfo,
  type AlgorithmResult,
} from '../../utils/advisor';

interface AdvisorProps {
  available: DraftTeam[];
  ownedByCurrentPicker: DraftTeam[];
  picker: DraftPlayer | null;
  onPick: (team: DraftTeam) => void;
}

const TOP_N = 8;

export function Advisor({ available, ownedByCurrentPicker, picker, onPick }: AdvisorProps) {
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(ALGORITHMS.map(a => a.id)),
  );
  const [primaryId, setPrimaryId] = useState<string>(ALGORITHMS[0].id);

  const allResults: AlgorithmResult[] = useMemo(
    () => runAll({ available, owned: ownedByCurrentPicker }),
    [available, ownedByCurrentPicker],
  );

  const activeResults = useMemo(
    () => allResults.filter(r => enabled.has(r.algorithmId)),
    [allResults, enabled],
  );

  const agreement = useMemo(
    () => computeAgreement(activeResults, TOP_N),
    [activeResults],
  );

  const primaryResult = useMemo(
    () => allResults.find(r => r.algorithmId === primaryId) ?? allResults[0],
    [allResults, primaryId],
  );

  // Build a unified row per team in the primary's top N, with all active scores merged.
  const rows = useMemo(() => {
    if (!primaryResult) return [];
    const top = primaryResult.ranked.slice(0, TOP_N);
    return top.map((entry, idx) => {
      const perAlgo: Record<string, { display: string; reason: string }> = {};
      for (const r of allResults) {
        const found = r.ranked.find(x => x.team.id === entry.team.id);
        if (found) perAlgo[r.algorithmId] = { display: found.display, reason: found.reason };
      }
      return {
        rank: idx + 1,
        team: entry.team,
        primaryReason: entry.reason,
        perAlgo,
        stars: agreement.get(entry.team.id) ?? 0,
      };
    });
  }, [primaryResult, allResults, agreement]);

  function toggle(id: string) {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (!picker) {
    return (
      <div className="py-6 text-center font-['DM_Sans'] text-sm text-white/40">
        Draft is complete.
      </div>
    );
  }

  const pickerColor = picker.colorHex;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h3 className="font-['Anybody'] text-sm font-black uppercase tracking-wider text-white">
            Advisor
          </h3>
          <p className="mt-0.5 font-['DM_Sans'] text-[11px] text-white/40">
            For{' '}
            <span style={{ color: pickerColor }} className="font-semibold">
              {picker.name}
            </span>
            's roster · {ownedByCurrentPicker.length} team
            {ownedByCurrentPicker.length === 1 ? '' : 's'} so far
          </p>
        </div>
      </div>

      {/* Algorithm chips */}
      <div className="mb-3 flex flex-wrap gap-1">
        {ALGORITHMS.map(algo => {
          const isOn = enabled.has(algo.id);
          const isPrimary = primaryId === algo.id;
          return (
            <button
              key={algo.id}
              onClick={() => {
                toggle(algo.id);
                if (!isOn) setPrimaryId(algo.id);
              }}
              onDoubleClick={() => setPrimaryId(algo.id)}
              title={`${algo.description}\n\nClick to toggle. Double-click to sort by this.`}
              className={`group inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-['DM_Sans'] text-[10px] font-bold uppercase tracking-wider transition-all ${
                isOn
                  ? isPrimary
                    ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                    : 'border-white/[0.12] bg-white/[0.06] text-white/80'
                  : 'border-white/[0.06] bg-transparent text-white/30 line-through'
              }`}
            >
              {algo.short}
              {isPrimary && (
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <p className="mb-3 font-['DM_Sans'] text-[10px] leading-snug text-white/30">
        Tap to toggle · double-tap to sort · ⭐ = top {TOP_N} in multiple algos
      </p>

      {/* Rows */}
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 480 }}>
        {rows.map(row => {
          const upset = upsetInfo(row.team);
          return (
            <button
              key={row.team.id}
              onClick={() => onPick(row.team)}
              className="group relative block w-full overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.05]"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: `linear-gradient(135deg, ${pickerColor}10, transparent 60%)` }}
              />

              {/* Top row: rank + name + stars */}
              <div className="relative flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-['Anybody'] text-[10px] font-black tabular-nums text-white/50">
                  {row.rank}
                </span>
                <span className="rounded bg-white/[0.06] px-1 font-['Anybody'] text-[9px] font-black tabular-nums text-white/60">
                  {row.team.seed}
                </span>
                <span className="min-w-0 flex-1 truncate font-['DM_Sans'] text-[12px] font-bold text-white">
                  {row.team.name}
                </span>
                <span className="shrink-0 font-['DM_Sans'] text-[9px] font-semibold uppercase tracking-wider text-white/35">
                  {row.team.region}
                </span>
                {row.stars >= 2 && (
                  <span
                    className="shrink-0 rounded bg-amber-400/15 px-1 py-0.5 font-['Anybody'] text-[9px] font-black tabular-nums text-amber-300"
                    title={`Top ${TOP_N} in ${row.stars} algorithms`}
                  >
                    ★{row.stars}
                  </span>
                )}
                {upset && (
                  <span
                    className="shrink-0 rounded bg-orange-500/15 px-1 py-0.5 font-['DM_Sans'] text-[8px] font-bold uppercase tracking-wider text-orange-300"
                    title={`${upset.label} historically ${(upset.rate * 100).toFixed(0)}%`}
                  >
                    Upset
                  </span>
                )}
              </div>

              {/* Per-algo scores strip */}
              <div className="relative mt-1.5 flex flex-wrap gap-1">
                {ALGORITHMS.filter(a => enabled.has(a.id)).map(a => {
                  const cell = row.perAlgo[a.id];
                  if (!cell) return null;
                  const isPrimaryAlgo = a.id === primaryId;
                  return (
                    <span
                      key={a.id}
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-['DM_Sans'] text-[9px] font-bold ${
                        isPrimaryAlgo
                          ? 'bg-amber-400/15 text-amber-300'
                          : 'bg-white/[0.04] text-white/60'
                      }`}
                    >
                      <span className="opacity-60">{a.short}</span>
                      <span>{cell.display}</span>
                    </span>
                  );
                })}
              </div>

              {/* Reason from primary algo */}
              <div className="relative mt-1.5 truncate font-['DM_Sans'] text-[10px] text-white/45">
                {row.primaryReason}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
