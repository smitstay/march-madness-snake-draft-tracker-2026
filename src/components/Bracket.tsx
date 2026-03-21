import { useState } from 'react';
import type { BracketData, BracketGame } from '../types';
import { BracketGameCard } from './BracketGame';
import { players } from '../data/picks';

interface BracketProps {
  bracket: BracketData;
}

const SECTION_NAMES: Record<number, string> = {
  1: 'First Four',
  2: 'East',
  3: 'West',
  4: 'South',
  5: 'Midwest',
  6: 'Final Four',
};

function getRoundFromBracketId(bracketId: number): number {
  if (bracketId >= 700) return 7;
  if (bracketId >= 600) return 6;
  if (bracketId >= 500) return 5;
  if (bracketId >= 400) return 4;
  if (bracketId >= 300) return 3;
  if (bracketId >= 200) return 2;
  if (bracketId >= 100) return 1;
  return 0;
}

const ROUND_LABELS: Record<number, string> = {
  1: 'First Four',
  2: 'Round of 64',
  3: 'Round of 32',
  4: 'Sweet 16',
  5: 'Elite Eight',
  6: 'Final Four',
  7: 'Championship',
};

function TBDSlot({ className = '' }: { className?: string }) {
  return (
    <div className={`flex h-[48px] w-[180px] items-center justify-center rounded-lg border border-dashed border-white/[0.06] text-[10px] text-white/15 ${className}`}>
      TBD
    </div>
  );
}

// Constants for bracket layout
const CARD_H = 48;   // height of a game card
const CARD_W = 180;
const COL_GAP = 24;  // horizontal gap between round columns
const COL_W = CARD_W + COL_GAP;

function RegionBracket({ regionName, games, flowDirection }: {
  regionName: string;
  games: BracketGame[];
  flowDirection: 'ltr' | 'rtl';
}) {
  const byRound: Record<number, BracketGame[]> = {};
  for (const game of games) {
    const rn = getRoundFromBracketId(game.bracketId);
    if (rn >= 2 && rn <= 5) {
      if (!byRound[rn]) byRound[rn] = [];
      byRound[rn].push(game);
    }
  }
  for (const rn of Object.keys(byRound)) {
    byRound[Number(rn)].sort((a, b) => a.bracketId - b.bracketId);
  }

  // Layout: 8 R64 slots define total height
  const SLOT_GAP = 6;
  const TOTAL_HEIGHT = 8 * CARD_H + 7 * SLOT_GAP;
  const REGION_W = COL_W * 4 - COL_GAP;

  // Get centered Y positions for games in each round
  function getYPositions(roundNum: number): number[] {
    const count = roundNum === 2 ? 8 : roundNum === 3 ? 4 : roundNum === 4 ? 2 : 1;
    if (count === 8) {
      // Evenly spaced
      return Array.from({ length: 8 }, (_, i) => i * (CARD_H + SLOT_GAP));
    }
    // Center between pairs of the previous round
    const prevPositions = getYPositions(roundNum - 1);
    const result: number[] = [];
    for (let i = 0; i < prevPositions.length; i += 2) {
      const y1 = prevPositions[i] + CARD_H / 2;
      const y2 = prevPositions[i + 1] + CARD_H / 2;
      result.push((y1 + y2) / 2 - CARD_H / 2);
    }
    return result;
  }

  // Column order depends on flow direction
  const rounds = [2, 3, 4, 5];
  const getColIndex = (roundNum: number) => {
    const idx = rounds.indexOf(roundNum);
    return flowDirection === 'ltr' ? idx : 3 - idx;
  };

  // Build connector lines (one SVG for all)
  const connectorLines: React.ReactNode[] = [];
  for (const srcRound of [2, 3, 4]) {
    const dstRound = srcRound + 1;
    const srcPositions = getYPositions(srcRound);
    const dstPositions = getYPositions(dstRound);
    const srcCol = getColIndex(srcRound);
    const dstCol = getColIndex(dstRound);

    for (let i = 0; i < srcPositions.length; i += 2) {
      const pairIdx = Math.floor(i / 2);
      const y1 = srcPositions[i] + CARD_H / 2;
      const y2 = srcPositions[i + 1] + CARD_H / 2;
      const yDst = dstPositions[pairIdx] + CARD_H / 2;

      // Horizontal exit from source games
      const srcRight = flowDirection === 'ltr'
        ? srcCol * COL_W + CARD_W
        : srcCol * COL_W;
      const dstLeft = flowDirection === 'ltr'
        ? dstCol * COL_W
        : dstCol * COL_W + CARD_W;
      const midX = (srcRight + dstLeft) / 2;

      const stroke = 'rgba(255,255,255,0.07)';
      connectorLines.push(
        <line key={`h1-${srcRound}-${i}`} x1={srcRight} y1={y1} x2={midX} y2={y1} stroke={stroke} strokeWidth={1} />,
        <line key={`h2-${srcRound}-${i}`} x1={srcRight} y1={y2} x2={midX} y2={y2} stroke={stroke} strokeWidth={1} />,
        <line key={`v-${srcRound}-${i}`} x1={midX} y1={y1} x2={midX} y2={y2} stroke={stroke} strokeWidth={1} />,
        <line key={`hd-${srcRound}-${i}`} x1={midX} y1={yDst} x2={dstLeft} y2={yDst} stroke={stroke} strokeWidth={1} />,
      );
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 text-center" style={{ width: REGION_W }}>
        <h3 className="font-['Anybody'] text-xs font-black uppercase tracking-[0.25em] text-white/70">
          {regionName}
        </h3>
      </div>
      <div className="relative" style={{ height: TOTAL_HEIGHT, width: REGION_W }}>
        {/* Connector SVG layer */}
        <svg className="pointer-events-none absolute inset-0" width={REGION_W} height={TOTAL_HEIGHT}>
          {connectorLines}
        </svg>

        {/* Game cards layer */}
        {rounds.map(roundNum => {
          const roundGames = byRound[roundNum] || [];
          const positions = getYPositions(roundNum);
          const colIdx = getColIndex(roundNum);
          const x = colIdx * COL_W;

          return positions.map((y, i) => {
            const game = roundGames[i];
            return (
              <div
                key={game?.contestId ?? `tbd-${roundNum}-${i}`}
                className="absolute"
                style={{ left: x, top: y }}
              >
                {game ? <BracketGameCard game={game} /> : <TBDSlot />}
              </div>
            );
          });
        })}

        {/* Round labels */}
        {rounds.map(roundNum => {
          const colIdx = getColIndex(roundNum);
          const x = colIdx * COL_W;
          return (
            <div
              key={`label-${roundNum}`}
              className="absolute text-center text-[9px] font-bold uppercase tracking-[0.12em] text-white/40"
              style={{ left: x, top: -18, width: CARD_W }}
            >
              {ROUND_LABELS[roundNum]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Bracket({ bracket }: BracketProps) {
  const [mobileTab, setMobileTab] = useState(2);

  const getRegionName = (sectionId: number): string => {
    const region = bracket.regions.find(r => r.sectionId === sectionId);
    return region?.name || SECTION_NAMES[sectionId] || `Region ${sectionId}`;
  };

  const bySection: Record<number, BracketGame[]> = {};
  for (const game of bracket.games) {
    const sid = game.sectionId;
    if (!bySection[sid]) bySection[sid] = [];
    bySection[sid].push(game);
  }

  const finalFourGames = (bySection[6] || []).filter(g => getRoundFromBracketId(g.bracketId) === 6);
  const championshipGames = (bySection[6] || []).filter(g => getRoundFromBracketId(g.bracketId) === 7);

  const regionTabs = [2, 3, 4, 5].filter(s => bySection[s]?.length);
  const allTabs = [...regionTabs, 6];

  // Mobile content
  const mobileContent = () => {
    if (mobileTab === 6) {
      return (
        <div className="flex flex-col gap-4 px-4 py-4">
          {finalFourGames.length > 0 && (
            <div>
              <h4 className="mb-2 font-['Anybody'] text-xs font-bold uppercase tracking-widest text-white/40">Final Four</h4>
              <div className="flex flex-col gap-2">{finalFourGames.map(g => <BracketGameCard key={g.contestId} game={g} />)}</div>
            </div>
          )}
          {championshipGames.length > 0 && (
            <div>
              <h4 className="mb-2 font-['Anybody'] text-xs font-bold uppercase tracking-widest text-amber-400/70">Championship</h4>
              <div className="flex flex-col gap-2">{championshipGames.map(g => <BracketGameCard key={g.contestId} game={g} />)}</div>
            </div>
          )}
          {finalFourGames.length === 0 && championshipGames.length === 0 && (
            <div className="py-12 text-center text-sm text-white/30">TBD</div>
          )}
        </div>
      );
    }

    const sectionGames = bySection[mobileTab] || [];
    const byRound: Record<number, BracketGame[]> = {};
    for (const g of sectionGames) {
      const rn = getRoundFromBracketId(g.bracketId);
      if (!byRound[rn]) byRound[rn] = [];
      byRound[rn].push(g);
    }
    const roundNums = Object.keys(byRound).map(Number).sort((a, b) => a - b);

    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        {roundNums.map(rn => (
          <div key={rn}>
            <h4 className="mb-2 font-['Anybody'] text-xs font-bold uppercase tracking-widest text-white/40">{ROUND_LABELS[rn] || `Round ${rn}`}</h4>
            <div className="flex flex-wrap gap-2">
              {byRound[rn].sort((a, b) => a.bracketId - b.bracketId).map(g => <BracketGameCard key={g.contestId} game={g} />)}
            </div>
          </div>
        ))}
        {roundNums.length === 0 && <div className="py-12 text-center text-sm text-white/30">No games yet</div>}
      </div>
    );
  };

  return (
    <div className="py-4">
      {/* Color legend — sticky on mobile */}
      <div className="sticky top-0 z-20 mx-auto mb-4 flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-white/[0.06] bg-[#0a0a0f]/90 px-4 py-2 backdrop-blur-md">
        {players.map(p => (
          <div key={p.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.colorHex }} />
            <span className="font-['DM_Sans'] text-xs font-medium text-white/60">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Desktop: full bracket */}
      <div className="hidden xl:block">
        <div className="overflow-x-auto pb-4">
          <div className="mx-auto flex items-start justify-center gap-4" style={{ minWidth: 1800, paddingTop: 24 }}>
            {/* Left regions (LTR flow → E8 feeds into center) */}
            <div className="flex flex-col gap-10">
              {[2, 4].map(sid => (
                bySection[sid] ? (
                  <RegionBracket
                    key={sid}
                    regionName={getRegionName(sid)}
                    games={bySection[sid]}
                    flowDirection="ltr"
                  />
                ) : null
              ))}
            </div>

            {/* Center: Final Four + Championship */}
            <div className="flex flex-col items-center self-center">
              <h3 className="mb-4 font-['Anybody'] text-sm font-black uppercase tracking-[0.25em] text-amber-400">
                Final Four
              </h3>
              <div className="flex flex-col gap-5">
                {finalFourGames.length > 0 ? (
                  finalFourGames.map(g => <BracketGameCard key={g.contestId} game={g} />)
                ) : (
                  <>
                    <TBDSlot className="border-amber-400/15" />
                    <TBDSlot className="border-amber-400/15" />
                  </>
                )}

                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-4 w-px bg-amber-400/20" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400/40">Championship</span>
                  <div className="h-4 w-px bg-amber-400/20" />
                </div>

                {championshipGames.length > 0 ? (
                  championshipGames.map(g => <BracketGameCard key={g.contestId} game={g} />)
                ) : (
                  <TBDSlot className="border-amber-400/25" />
                )}
              </div>
            </div>

            {/* Right regions (RTL flow → E8 feeds into center) */}
            <div className="flex flex-col gap-10">
              {[3, 5].map(sid => (
                bySection[sid] ? (
                  <RegionBracket
                    key={sid}
                    regionName={getRegionName(sid)}
                    games={bySection[sid]}
                    flowDirection="rtl"
                  />
                ) : null
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet: tabbed */}
      <div className="xl:hidden">
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-3">
          {allTabs.map(sid => (
            <button
              key={sid}
              onClick={() => setMobileTab(sid)}
              className={`shrink-0 rounded-lg px-3 py-1.5 font-['Anybody'] text-xs font-bold uppercase tracking-wider transition-all
                ${mobileTab === sid
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'bg-white/[0.04] text-white/40 hover:text-white/60'
                }
              `}
            >
              {sid === 6 ? 'Final Four' : getRegionName(sid)}
            </button>
          ))}
        </div>
        {mobileContent()}
      </div>
    </div>
  );
}
