import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advancement, playerForPick, simulate, recommend, validPicks, validateSnapshot } from '../src/edge/engine.ts';
const history = JSON.parse(readFileSync(new URL('../src/edge/history.json', import.meta.url), 'utf8'));
const snapshot = validateSnapshot(history.snapshots.at(-1));

test('official historical brackets validate; advancement conserves every round and 63 points', () => {
  for (const raw of history.snapshots) {
    const s = validateSnapshot(raw);
    for (let r = 0; r < 6; r++) assert.ok(Math.abs(s.teams.reduce((n, t) => n + t.advance[r], 0) - 32 / 2 ** r) < 1e-4);
    assert.ok(Math.abs(s.teams.reduce((n, t) => n + t.expectedWins, 0) - 63) < 1e-4);
    assert.ok(s.trainedThrough < s.season);
    s.teams.forEach(t => t.advance.slice(1).forEach((p, i) => assert.ok(p <= t.advance[i])));
  }
});
test('fair coins give geometric advancement; roster EV adds without collision penalty', () => {
  const a = advancement(Array.from({ length: 64 }, () => Array(64).fill(.5)));
  assert.deepEqual(a[0], [.5, .25, .125, .0625, .03125, .015625]);
  assert.equal(a[0].reduce((x,y)=>x+y,0) + a[1].reduce((x,y)=>x+y,0), 1.96875);
});
test('snake gives all seats eight picks and reverses at turns', () => {
  assert.deepEqual(Array.from({length: 18},(_,i)=>playerForPick(i)), [0,1,2,3,4,5,6,7,7,6,5,4,3,2,1,0,0,1]);
  for(let s=0;s<8;s++) assert.equal(Array.from({length:64},(_,i)=>playerForPick(i)).filter(x=>x===s).length,8);
});
test('simulations are reproducible, score exactly 63, and match analytic expected wins', () => {
  const games = simulate(snapshot, 20000);
  assert.deepEqual(games.slice(0,2), simulate(snapshot,2));
  games.forEach(w => assert.equal(w.reduce((n,x)=>n+x,0),63));
  snapshot.teams.forEach((t,i)=>assert.ok(Math.abs(games.reduce((n,w)=>n+w[i],0)/games.length-t.expectedWins)<.06));
});
test('last pick preserves full rosters and exact tie shares', () => {
  const picks=Array.from({length:63},(_,i)=>i);
  const ties = [new Uint8Array(64)]; // Synthetic equal scores to test tie policy independently.
  const r=recommend(snapshot,picks,0,'seed',ties);
  assert.equal(r.length,1); assert.equal(r[0].index,63); assert.equal(r[0].winShare,1/8); assert.equal(r[0].nextBest,null);
  assert.deepEqual(recommend(snapshot,[],1,'seed',ties),[]);
  assert.deepEqual(recommend(snapshot,Array.from({length:64},(_,i)=>i),0,'seed',ties),[]);
});
test('reject duplicate picks, invalid probabilities, leakage metadata, and wrong bracket ordering', () => {
  assert.ok(!validPicks([1,1])); assert.ok(!validPicks([64])); assert.ok(!validPicks(['1']));
  for (const mutate of [
    (s: typeof snapshot)=> {s.probabilities[0][1]=2;},
    (s: typeof snapshot)=> {s.teams[1].id=s.teams[0].id;},
    (s: typeof snapshot)=> {s.trainedThrough=s.season;},
    (s: typeof snapshot)=> {s.regularSeasonLastDay=100;},
    (s: typeof snapshot)=> {[s.teams[0],s.teams[2]]=[s.teams[2],s.teams[0]];},
  ]) {const copy=structuredClone(snapshot);mutate(copy);assert.throws(()=>validateSnapshot(copy));}
});
test('public production bundle contains no private UI or historical model', () => {
  const html = readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const js = html.match(/src="\.\/([^"]+\.js)"/)![1];
  const bundle = readFileSync(new URL(`../dist/${js}`,import.meta.url),'utf8');
  assert.ok(!bundle.includes('private-edge-v1')); assert.ok(!bundle.includes('seedSrs')); assert.ok(!bundle.includes('Draft Lab'));
});
