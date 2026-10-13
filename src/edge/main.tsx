import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import history from './history.json';
import { playerForPick, recommend, simulate, validPicks, validateSnapshot } from './engine';
import type { Snapshot } from './engine';
import './style.css';

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const players = ['Jack', 'Ben', 'Connor', 'Taylor', 'Will', 'Coby', 'Peter', 'Chris'];
const snapshots = history.snapshots as Snapshot[];
function storageKey(s: Snapshot) { return `private-edge-v1-${s.season}-${s.teams.map(t => t.id).join('-')}`; }
function readPicks(s: Snapshot): number[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(storageKey(s)) ?? '[]'); return validPicks(value) ? value : []; }
  catch { return []; }
}
export default function Lab() {
  const [snapshot, setSnapshot] = useState(() => validateSnapshot(snapshots[snapshots.length - 1]));
  const [picks, setPicks] = useState<number[]>(() => readPicks(snapshot));
  const [seat, setSeat] = useState(3);
  const [opponents, setOpponents] = useState<'seed' | 'ev'>('seed');
  const [sort, setSort] = useState<'ev' | 'win'>('ev');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('draft');
  const [showResults, setShowResults] = useState(false);
  const samples = useMemo(() => simulate(snapshot), [snapshot]);
  const recs = useMemo(() => recommend(snapshot, picks, seat, opponents, samples), [snapshot, picks, seat, opponents, samples]);
  const recById = new Map(recs.map(r => [r.index, r]));
  const available = snapshot.teams.map((team, index) => ({ ...team, index }))
    .filter(t => !picks.includes(t.index) && t.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'win' && recs.length ? recById.get(b.index)!.winShare - recById.get(a.index)!.winShare : b.expectedWins - a.expectedWins);
  const myPicks = picks.filter((_, i) => playerForPick(i) === seat);
  const complete = picks.length === 64;
  const mine = !complete && playerForPick(picks.length) === seat;
  function save(next: number[]) {
    setPicks(next);
    try { localStorage.setItem(storageKey(snapshot), JSON.stringify(next)); }
    catch { setError('Browser storage unavailable. Keep this page open or export your draft.'); }
  }
  function load(value: unknown) {
    try { const s = validateSnapshot(value); setSnapshot(s); setPicks(readPicks(s)); setError(''); setShowResults(false); }
    catch (e) { setError(e instanceof Error ? e.message : 'Invalid forecast'); }
  }
  async function upload(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10_000_000) throw new Error('File exceeds 10 MB.');
      const json = JSON.parse(await file.text());
      if (json.snapshots) load(json.snapshots.at(-1)); else load(json);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to import'); }
  }
  function exportDraft() {
    const blob = new Blob([JSON.stringify({ season: snapshot.season, teamIds: picks.map(i => snapshot.teams[i].id), seat, snapshot }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `private-draft-${snapshot.season}.json`; link.click(); URL.revokeObjectURL(url);
  }
  async function importDraft(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10_000_000) throw new Error('File exceeds 10 MB.');
      const draft = JSON.parse(await file.text()); const s = validateSnapshot(draft.snapshot);
      if (!Array.isArray(draft.teamIds) || !Number.isInteger(draft.seat) || draft.seat < 0 || draft.seat > 7) throw new Error('Invalid draft file');
      const next = draft.teamIds.map((id: string) => s.teams.findIndex(t => t.id === id));
      if (!validPicks(next)) throw new Error('Invalid draft picks');
      setSnapshot(s); setPicks(next); setSeat(draft.seat); setError(''); setShowResults(false);
      localStorage.setItem(storageKey(s), JSON.stringify(next));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to import draft'); }
  }
  return <main>
    <header><div><span className="eyebrow">PRIVATE / EIGHT PLAYERS / ONE POINT PER WIN</span><h1>Draft Lab<span> / March</span></h1></div><span className="badge">64 teams · 8 rounds</span></header>
    <div className="notice"><strong>{snapshot.status === 'historical' ? `${snapshot.season} historical practice field` : `${snapshot.season} imported forecast`}</strong><br/>
      {snapshot.status === 'historical' ? 'Not a live 2027 recommendation. Import the resolved bracket after the First Four, with fresh regular-season data.' : 'Verify all 64 teams and Final Four pairings before drafting. First Four wins do not count.'}
      {' '}Model trained through {snapshot.trainedThrough}; regular-season cutoff day {snapshot.regularSeasonLastDay}. {snapshot.model}.</div>
    <nav>{['draft', 'evidence', 'method'].map(t => <button className={tab === t ? 'active' : ''} key={t} onClick={() => setTab(t)}>{t === 'draft' ? 'Draft room' : t === 'evidence' ? 'Historical evidence' : 'Strategy & data'}</button>)}</nav>
    {error && <p className="error" role="alert">{error}</p>}
    {tab === 'draft' && <>
      <section className="controls">
        <label>Practice season<select value={snapshots.some(s => s.season === snapshot.season) && snapshot.status === 'historical' ? snapshot.season : ''} onChange={e => load(snapshots.find(s => s.season === +e.target.value))}><option value="" disabled>Imported forecast</option>{snapshots.map(s => <option key={s.season} value={s.season}>{s.season}</option>)}</select></label>
        <label>My draft seat<select value={seat} onChange={e => setSeat(+e.target.value)}>{players.map((name, i) => <option value={i} key={name}>{i + 1} · {name}</option>)}</select></label>
        <label>Other players favor<select value={opponents} onChange={e => setOpponents(e.target.value as 'seed' | 'ev')}><option value="seed">Seed order</option><option value="ev">Model expected wins</option></select></label>
        <label>Rank by<select value={sort} onChange={e => setSort(e.target.value as 'ev' | 'win')}><option value="ev">Expected wins</option><option value="win">Simulated league win share</option></select></label>
      </section>
      <div className="stats"><article><small>ON THE CLOCK</small><h2>{complete ? 'Draft complete' : players[playerForPick(picks.length)]}</h2><p>{complete ? 'All 64 teams selected' : `Pick ${picks.length + 1} / 64 · Round ${Math.floor(picks.length / 8) + 1}${mine ? ' · YOUR TURN' : ''}`}</p></article><article><small>MY ROSTER EXPECTATION</small><h2>{myPicks.reduce((a, i) => a + snapshot.teams[i].expectedWins, 0).toFixed(2)} <em>points</em></h2><p>{myPicks.length} / 8 teams · Field total: 63 points</p></article><article><small>RECOMMENDED BY EXPECTED WINS</small><h2>{[...snapshot.teams].filter(t => !picks.some(i => snapshot.teams[i].id === t.id)).sort((a,b) => b.expectedWins-a.expectedWins)[0]?.name ?? 'Complete'}</h2><p>Own both opponents? Their expectations still add.</p></article></div>
      <div className="toolbar"><input aria-label="Search available teams" placeholder="Search available teams…" value={query} onChange={e => setQuery(e.target.value)}/><button disabled={!picks.length} onClick={() => save(picks.slice(0, -1))}>Undo pick</button><button onClick={() => { if (confirm('Clear this private practice draft?')) save([]); }}>Reset draft</button><button onClick={exportDraft}>Export draft</button></div>
      <p className="muted">{mine ? 'Win share: 4,000 shared tournament simulations; tied first place splits credit. Future picks follow the selected opponent strategy, with fixed bracket-order tie breaks. Differences below about 1 percentage point may be simulation noise.' : 'Record each player’s pick. League win-share comparisons appear on your turn.'} These are model scenarios, not measured odds of beating your friends.</p>
      <div className="table-wrap"><table><thead><tr><th>Team / bracket region code</th><th>Seed</th><th>Expected wins</th><th>vs seed average</th><th>R32</th><th>S16</th><th>E8</th><th>F4</th><th>Final</th><th>Title</th><th>League win share</th><th>Likely next pick</th><th/></tr></thead><tbody>{available.map(t => <tr key={t.id}><td><strong>{t.name}</strong><small>{t.region} · SRS {t.srs.toFixed(1)}</small></td><td>{t.seed}</td><td className="accent">{t.expectedWins.toFixed(2)}</td><td>{t.expectedWins - t.seedBaseline >= 0 ? '+' : ''}{(t.expectedWins - t.seedBaseline).toFixed(2)}</td>{t.advance.map((p, i) => <td key={i}>{pct(p)}</td>)}<td>{recById.has(t.index) ? pct(recById.get(t.index)!.winShare) : '—'}</td><td>{recById.get(t.index)?.nextBest ?? '—'}</td><td><button disabled={complete} onClick={() => save([...picks, t.index])}>Pick</button></td></tr>)}</tbody></table></div>
      <section><h2>Draft board</h2><div className="rosters">{players.map((name, owner) => <article key={name} className={owner === seat ? 'selected' : ''}><h3>Seat {owner + 1} · {name}</h3><ol>{picks.map((t, i) => ({ t, i })).filter(({ i }) => playerForPick(i) === owner).map(({ t, i }) => <li key={i}>#{i + 1} {snapshot.teams[t].name}</li>)}</ol></article>)}</div></section>
      <section className="controls"><label>Import forecast JSON<input type="file" accept="application/json,.json" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }}/></label><label>Restore exported draft<input type="file" accept="application/json,.json" onChange={e => { void importDraft(e.target.files?.[0]); e.target.value = ''; }}/></label></section>
      <p className="muted">Private drafts stay in this browser and are independent of the public draft room. Export to move between devices. Browser data can be cleared.</p>
    </>}
    {tab === 'evidence' && <section>
      <h2>Test the edge, don’t assume it</h2><p>{history.folds.length} complete held-out tournaments ({history.folds[0].season}–{history.folds.at(-1)!.season}). Every year trained only on earlier tournaments. No 2020 tournament; 2021 excluded because of the no-contest. Historical mirror ends in 2023.</p>
      <table><thead><tr><th>Regression</th><th>Brier ↓</th><th>Log loss ↓</th><th>Team wins MAE ↓</th></tr></thead><tbody>{(['seedOnly', 'seedSrs'] as const).map(k => <tr key={k}><td>{k === 'seedOnly' ? 'Seed only' : 'Seed + regular-season SRS'}</td><td>{history.summary[k].brier.toFixed(4)}</td><td>{history.summary[k].logLoss.toFixed(4)}</td><td>{history.summary[k].teamWinsMAE.toFixed(3)}</td></tr>)}</tbody></table>
      <h3>Actual historical outcomes, hypothetical snake drafts</h3><p>One model drafter versus seven simulated opponents; all eight seats; 100 paired tie-break repetitions per seat and season. Comparator: historical seed-average expected wins learned from earlier years. Confidence intervals resample whole years.</p>
      {history.draftSummary.map(s => <article key={s.opponents}><h3>Opponents: {s.opponents === 'seed' ? 'seed order' : 'historical seed expected wins'}</h3><p>Model win share {pct(s.modelWinShare)} · Baseline {pct(s.baselineWinShare)} · Points difference {s.pointsDelta.toFixed(2)}</p><p>95% interval for win-share improvement: {(s.winShareDeltaCI95[0] * 100).toFixed(1)} to {(s.winShareDeltaCI95[1] * 100).toFixed(1)} percentage points. {s.winShareDeltaCI95[0] <= 0 ? 'Includes zero: an advantage is not established by this test.' : 'Positive in this opponent scenario; not a guarantee against real players.'}</p></article>)}
      <button onClick={() => setShowResults(!showResults)}>{showResults ? 'Hide' : 'Show'} yearly results (practice spoilers)</button>
      {showResults && <table><thead><tr><th>Season</th><th>Training games</th><th>Seed Brier</th><th>SRS Brier</th></tr></thead><tbody>{history.folds.map(f => <tr key={f.season}><td>{f.season}</td><td>{f.trainingGames}</td><td>{f.seedOnly.brier.toFixed(4)}</td><td>{f.seedSrs.brier.toFixed(4)}</td></tr>)}</tbody></table>}
      <p className="muted">The live win-share lookahead itself has not been evaluated by this historical draft test; it tests expected-wins ranking. Do not interpret the two as the same strategy.</p>
    </section>}
    {tab === 'method' && <section className="prose"><h2>Draft wins, not just a champion</h2><p>A team’s expected points equal its probabilities of reaching R32, S16, E8, F4, the final, and winning the title, added together. A good path can make a lower seed worth more than a higher seed. The table’s seed-average difference helps identify those opportunities.</p><p>Roster expected points add exactly. Owning teams that might meet changes the variance and league-win probability, but does not justify subtracting an extra collision penalty from bracket-aware expected wins. The simulation plays a single consistent bracket for all eight rosters.</p><h3>Use your snake position</h3><p>Record every pick, select your seat, and compare the strongest available team with the team likely to survive until your next turn. Early-round strength matters under equal scoring. Avoid drafting an upset story just because its seed makes it memorable. Check whether the recommendation survives both opponent assumptions.</p><h3>Data and updates</h3><p>Run the repository’s analytics/refresh.py for the pinned 1985–2023 archive. For the next tournament, supply newer Kaggle-format regular-season results, tournament seeds, official slots, and completed First Four results; then run analytics/model.py with --forecast-year 2027 and import its JSON. No fabricated 2027 field is used here.</p><p>SRS fits scoring margins to opponent strength and home court using games through Selection Sunday. The matchup regression uses seed difference and SRS difference. It does not ingest injuries, current betting lines, or possession-adjusted ratings. Those are useful future data additions, but require timestamped historical inputs and validation.</p><h3>Research</h3><ul><li><a href="https://arxiv.org/abs/1412.0248">Lopez & Matthews: predictive modeling and tournament luck</a> — motivates simple logistic models and probabilistic evaluation; this implementation is not their Vegas/efficiency ensemble.</li><li><a href="https://www.degruyterbrill.com/document/doi/10.1515/jqas-2015-0013/html">Glickman & Sonas: NCAA prediction methods</a> — discusses contamination from ratings that include tournament results.</li><li><a href="https://www.kaggle.com/competitions/march-machine-learning-mania-2026/data">Kaggle / Sonas: data dictionary</a> — official seed, slot, team ID, and game schemas.</li><li><a href="https://huggingface.co/Jensen-holm/Nigl/tree/cc53f5ea4242c351c8781a62b4f5a3f3188ad89a/data">Pinned historical data mirror</a> — reproducible inputs; newer seasons must be supplied separately.</li></ul><p>Equal probabilities do not eliminate uncertainty. League win share depends on opponent behavior and tie rules; this tool defaults to equal shares of a tie. No strategy guarantees a win.</p></section>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Lab/></StrictMode>);
