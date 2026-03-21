import { useState } from 'react';
import type { TabType } from './types';
import { useGameData } from './hooks/useGameData';
import { Layout } from './components/Layout';
import { Scoreboard } from './components/Scoreboard';
import { Bracket } from './components/Bracket';
import { TeamsView } from './components/TeamsView';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10">
          <span className="text-2xl">🏀</span>
        </div>
        <div>
          <h1 className="font-['Anybody'] text-2xl font-black uppercase tracking-wider text-white">
            March Madness
          </h1>
          <p className="font-['DM_Sans'] text-xs font-medium uppercase tracking-widest text-amber-400/60">
            Snake Draft Tracker
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-amber-400" />
        </div>
        <p className="text-center font-['DM_Sans'] text-xs text-white/30">
          Loading tournament data...
        </p>
      </div>

      <div className="mt-6 flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400/50"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
      <div className="mb-4 rounded-2xl bg-red-500/10 p-4">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="mb-2 font-['Anybody'] text-lg font-bold text-white">Failed to Load</h2>
      <p className="mb-4 max-w-sm text-center font-['DM_Sans'] text-sm text-white/50">{error}</p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-amber-400/20 px-4 py-2 font-['DM_Sans'] text-sm font-semibold text-amber-400 transition-all hover:bg-amber-400/30"
      >
        Try Again
      </button>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('scoreboard');
  const { bracket, scores, loading, error, lastUpdated, isLive, refresh } = useGameData();

  if (!bracket && loading) {
    return <LoadingScreen />;
  }

  if (error && !bracket) {
    return <ErrorScreen error={error} onRetry={refresh} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLive={isLive}
      lastUpdated={lastUpdated}
      onRefresh={refresh}
      loading={loading}
    >
      {activeTab === 'scoreboard' && <Scoreboard scores={scores} />}
      {activeTab === 'bracket' && bracket && <Bracket bracket={bracket} />}
      {activeTab === 'teams' && <TeamsView scores={scores} />}
    </Layout>
  );
}
