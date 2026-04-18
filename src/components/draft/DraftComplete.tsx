import { useState } from 'react';
import type { DraftPick, DraftPlayer } from '../../types';

interface DraftCompleteProps {
  players: DraftPlayer[];
  rosters: Record<string, DraftPick[]>;
  teamsPerPlayer: number;
  onReset: () => void;
}

function buildCsv(players: DraftPlayer[], rosters: Record<string, DraftPick[]>, teamsPerPlayer: number): string {
  // Mirror picks.csv format: tab-separated, first row = player names, subsequent rows = picks per round.
  const header = players.map(p => p.name).join('\t');
  const rows: string[] = [header];
  for (let round = 0; round < teamsPerPlayer; round++) {
    const row = players.map(player => {
      const picks = rosters[player.name] ?? [];
      return picks[round]?.team.name ?? '';
    });
    rows.push(row.join('\t'));
  }
  return rows.join('\n');
}

export function DraftComplete({ players, rosters, teamsPerPlayer, onReset }: DraftCompleteProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const csv = buildCsv(players, rosters, teamsPerPlayer);
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const csv = buildCsv(players, rosters, teamsPerPlayer);
    const blob = new Blob([csv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'picks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-white/[0.02] p-6 sm:p-8">
      <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-amber-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span className="font-['DM_Sans'] text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300/80">
            Draft Complete
          </span>
        </div>
        <h2 className="font-['Anybody'] text-2xl font-black uppercase tracking-wider text-white sm:text-4xl">
          All picks are in.
        </h2>
        <p className="mt-2 max-w-lg font-['DM_Sans'] text-sm text-white/60">
          Export your rosters in the same format the tracker uses — drop it in as{' '}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px]">picks.csv</code>{' '}
          and you're ready for tip-off.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={handleDownload}
            className="rounded-lg bg-amber-400 px-4 py-2 font-['DM_Sans'] text-sm font-bold text-black transition-all hover:bg-amber-300"
          >
            Download picks.csv
          </button>
          <button
            onClick={handleCopy}
            className="rounded-lg border border-white/[0.12] bg-white/[0.04] px-4 py-2 font-['DM_Sans'] text-sm font-semibold text-white transition-all hover:bg-white/[0.08]"
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
          <button
            onClick={onReset}
            className="ml-auto rounded-lg border border-white/[0.06] bg-transparent px-4 py-2 font-['DM_Sans'] text-sm font-semibold text-white/50 transition-all hover:border-red-500/30 hover:text-red-400"
          >
            Start a new draft
          </button>
        </div>
      </div>
    </div>
  );
}
