import { type ReactNode } from 'react';
import type { TabType } from '../types';
import { LiveIndicator } from './LiveIndicator';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isLive: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'scoreboard', label: 'Scores', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'bracket', label: 'Bracket', icon: 'M4 6h16M4 12h8m-8 6h16' },
  { id: 'teams', label: 'Teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function Layout({ children, activeTab, onTabChange, isLive, lastUpdated, onRefresh, loading }: LayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#0a0a0f]">
      {/* Noise texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Subtle court-line pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
        <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none fixed left-1/2 top-0 z-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/[0.04] blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10">
              <span className="text-lg">🏀</span>
            </div>
            <div>
              <h1 className="font-['Anybody'] text-base font-black uppercase tracking-wider text-white sm:text-lg">
                March Madness
              </h1>
              <p className="font-['DM_Sans'] text-[10px] font-medium uppercase tracking-widest text-amber-400/60">
                Snake Draft Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLive && <LiveIndicator />}
            {lastUpdated && (
              <span className="font-['DM_Sans'] text-[10px] text-white/30">
                Updated {timeAgo(lastUpdated)}
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="rounded-lg bg-white/[0.06] p-2 text-white/40 transition-all hover:bg-white/[0.1] hover:text-white/70 disabled:opacity-30"
              title="Refresh"
            >
              <svg
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 font-['DM_Sans'] text-sm font-semibold transition-all
                  ${activeTab === tab.id
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-white/40 hover:text-white/60'
                  }
                `}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
