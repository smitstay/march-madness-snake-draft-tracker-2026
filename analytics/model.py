"""Walk-forward NCAA probability regression and equal-win snake draft backtest.

Only Selection Sunday regular-season inputs enter SRS. Every held-out tournament
is predicted using regressions fitted on strictly earlier tournaments. First Four
winners resolve the field, but their wins never score or train the model.
"""
import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from scipy.sparse import coo_matrix, vstack, eye
from scipy.sparse.linalg import lsqr
from scipy.special import expit
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss

ROOT = Path(__file__).resolve().parent.parent


def read(path):
    return list(csv.DictReader(path.open(encoding='utf-8-sig')))


def srs(games):
    """Ridge-adjusted score margin: team A - team B + home advantage.

    Neutral=0, winner home=1, away=-1. L2 penalty 1, including home coefficient.
    Scores are not possessions-adjusted efficiency; call this SRS, not KenPom.
    """
    teams = sorted({int(g[k]) for g in games for k in ['WTeamID', 'LTeamID']})
    ix = {t: i for i, t in enumerate(teams)}
    row, col, val, target = [], [], [], []
    for i, g in enumerate(games):
        row += [i, i, i]
        col += [ix[int(g['WTeamID'])], ix[int(g['LTeamID'])], len(teams)]
        val += [1, -1, {'H': 1, 'A': -1, 'N': 0}[g['WLoc']]]
        target.append(int(g['WScore']) - int(g['LScore']))
    x = coo_matrix((val, (row, col)), shape=(len(games), len(teams) + 1)).tocsr()
    fit = lsqr(vstack([x, eye(len(teams) + 1)]), np.r_[target, np.zeros(len(teams) + 1)],
               atol=1e-10, btol=1e-10)[0]
    return {t: float(fit[i]) for t, i in ix.items()}


def features(a, b, seed, rating):
    return [(seed[b] - seed[a]) / 10, (rating[a] - rating[b]) / 10]


def fit_model(x, y, enriched):
    # Symmetric examples and no intercept guarantee P(a,b) + P(b,a) = 1.
    x = np.asarray(x)[:, :2 if enriched else 1]
    model = LogisticRegression(C=1.0, fit_intercept=False, max_iter=2000)
    model.fit(np.r_[x, -x], np.r_[y, 1 - np.asarray(y)])
    return model.coef_[0]


def matrix(teams, seed, rating, coef):
    x = np.array([features(a, b, seed, rating) for a in teams for b in teams])
    return expit(x[:, :len(coef)] @ coef).reshape(len(teams), len(teams))


def bracket_order(seed_rows, slots, results):
    """Traverse official slot tree; resolve only preliminary games from results."""
    seeds = {r['Seed']: int(r['TeamID']) for r in seed_rows}
    tree = {r['Slot']: (r['StrongSeed'], r['WeakSeed']) for r in slots}
    prelim = {k: v for k, v in tree.items() if not k.startswith('R')}
    for slot, (a, b) in prelim.items():
        matches = [g for g in results if {int(g['WTeamID']), int(g['LTeamID'])} == {seeds[a], seeds[b]}]
        if len(matches) != 1:
            raise ValueError(f'First Four slot {slot} unresolved; supply its result after the game')
        seeds[slot] = int(matches[0]['WTeamID'])
    def visit(slot):
        if slot in seeds:
            return [seeds[slot]]
        a, b = tree[slot]
        return visit(a) + visit(b)
    roots = set(tree) - {x for pair in tree.values() for x in pair}
    if len(roots) != 1:
        raise ValueError('Bracket must have one championship slot')
    order = visit(roots.pop())
    if len(order) != 64 or len(set(order)) != 64:
        raise ValueError('Expected 64 resolved main-bracket teams')
    return order


def advancement(p):
    n = len(p)
    if n != 64:
        raise ValueError('Expected 64 teams')
    reach = np.ones(n)
    rounds = []
    for r in range(6):
        width = 2 ** r
        nxt = np.zeros(n)
        for i in range(n):
            other = ((i // width) ^ 1) * width
            nxt[i] = reach[i] * (p[i, other:other + width] @ reach[other:other + width])
        rounds.append(nxt)
        reach = nxt
    return np.array(rounds).T


def slot_for_pick(pick):
    r, pos = divmod(pick, 8)
    return pos if r % 2 == 0 else 7 - pos


def draft(ranks, seat, strategy):
    available = set(range(64))
    rosters = [[] for _ in range(8)]
    for pick in range(64):
        owner = slot_for_pick(pick)
        ranking = strategy if owner == seat else ranks[owner]
        team = next(t for t in ranking if t in available)
        rosters[owner].append(team)
        available.remove(team)
    return rosters


def share(rosters, wins, seat):
    scores = np.array([sum(wins[t] for t in roster) for roster in rosters])
    leaders = scores == max(scores)
    return float(leaders[seat] / sum(leaders)), float(scores[seat])


def draft_backtest(ev, baseline, seeds, wins, rng, repetitions=100):
    rows = []
    # Two explicitly hypothetical opponent populations; no claimed real draft ADP.
    for opponent in ['seed', 'seed-ev']:
        value = -np.array(seeds) if opponent == 'seed' else baseline
        out = []
        for seat in range(8):
            paired = []
            for _ in range(repetitions):
                ranks = [np.lexsort((rng.random(64), -value)).tolist() for _ in range(8)]
                ties = rng.random(64)
                model_rank = np.lexsort((ties, -ev)).tolist()
                base_rank = np.lexsort((ties, -baseline)).tolist()
                m = share(draft(ranks, seat, model_rank), wins, seat)
                b = share(draft(ranks, seat, base_rank), wins, seat)
                paired.append([*m, *b])
            avg = np.mean(paired, axis=0)
            out.append({'seat': seat + 1, 'modelWinShare': avg[0], 'modelPoints': avg[1],
                        'baselineWinShare': avg[2], 'baselinePoints': avg[3]})
        rows.append({'opponents': opponent, 'seats': out})
    return rows


def run(data, start, end, forecast_year=None):
    raw = {name: read(data / f'{name}.csv') for name in ['MTeams', 'MRegularSeasonCompactResults',
           'MNCAATourneyCompactResults', 'MNCAATourneySeeds', 'MNCAATourneySlots']}
    names = {int(r['TeamID']): r['TeamName'] for r in raw['MTeams']}
    grouped = {}
    for name, rows in raw.items():
        if name == 'MTeams':
            continue
        grouped[name] = defaultdict(list)
        for r in rows:
            grouped[name][int(r['Season'])].append(r)
    xtrain, ytrain, folds, snapshots, excluded = [], [], [], [], []
    trained_years = []
    seed_totals, seed_counts = Counter(), Counter()
    rng = np.random.default_rng(20270318)
    years = sorted(grouped['MNCAATourneySeeds'])
    if forecast_year is not None and forecast_year not in years:
        raise ValueError(f'No {forecast_year} seeds in supplied data; download the real field first')
    for year in years:
        if year > max(end, forecast_year or end):
            continue
        sr = grouped['MNCAATourneySeeds'][year]
        tr = grouped['MNCAATourneyCompactResults'][year]
        sl = grouped['MNCAATourneySlots'][year]
        regular = [g for g in grouped['MRegularSeasonCompactResults'][year] if int(g['DayNum']) <= 132]
        if not regular or not sl:
            excluded.append({'year': year, 'reason': 'Missing regular-season data or bracket slots'})
            continue
        seed = {int(r['TeamID']): int(r['Seed'][1:3]) for r in sr}
        rating = srs(regular)
        prelim_pairs = {frozenset((int(a['TeamID']), int(b['TeamID'])))
                        for a in sr for b in sr if a['Seed'] != b['Seed'] and a['Seed'][:3] == b['Seed'][:3]}
        main = [g for g in tr if frozenset((int(g['WTeamID']), int(g['LTeamID']))) not in prelim_pairs]
        # 2021 has an unplayed Oregon/VCU game. Exclude the incomplete tournament,
        # rather than quietly fabricate its outcome or call 62 points a full year.
        complete = len(main) == 63
        if not complete and year != forecast_year:
            excluded.append({'year': year, 'reason': f'{len(main)} main-bracket results; require 63 (2021 includes a no-contest)'})
            continue
        order = bracket_order(sr, sl, tr)
        if any(t not in rating for t in order):
            raise ValueError(f'{year}: Missing team regular-season rating')
        if year >= start and xtrain and (year <= end or year == forecast_year):
            coefs = [fit_model(xtrain, ytrain, enriched) for enriched in [False, True]]
            probs = [matrix(order, seed, rating, c) for c in coefs]
            advances = [advancement(p) for p in probs]
            ev = advances[1].sum(axis=1)
            baseline = np.array([seed_totals[seed[t]] / seed_counts[seed[t]] for t in order])
            ids = {t: i for i, t in enumerate(order)}
            snapshot = {'season': year, 'status': 'historical' if complete else 'forecast',
                        'trainedThrough': max(trained_years),
                        'regularSeasonLastDay': max(int(g['DayNum']) for g in regular),
                        'model': 'Seed + regular-season SRS logistic regression',
                        'coefficients': coefs[1].tolist(), 'probabilities': np.round(probs[1], 7).tolist(),
                        'teams': [{'id': str(t), 'name': names[t], 'seed': seed[t],
                                   'region': next(r['Seed'][0] for r in sr if int(r['TeamID']) == t),
                                   'srs': rating[t], 'expectedWins': float(ev[i]),
                                   'seedBaseline': float(baseline[i]), 'advance': advances[1][i].tolist()}
                                  for i, t in enumerate(order)]}
            snapshots.append(snapshot)
            if complete:
                win_counts = Counter(int(g['WTeamID']) for g in main)
                wins = np.array([win_counts[t] for t in order])
                metrics = []
                for p, a in zip(probs, advances):
                    predictions = np.array([p[ids[int(g['WTeamID'])], ids[int(g['LTeamID'])]] for g in main])
                    # Symmetric scoring has exactly the same per-game loss, without winner bias.
                    both = np.r_[predictions, 1 - predictions]
                    truth = np.r_[np.ones(63), np.zeros(63)]
                    metrics.append({'brier': float(brier_score_loss(truth, both)),
                                    'logLoss': float(log_loss(truth, both)),
                                    'teamWinsMAE': float(np.mean(abs(a.sum(axis=1) - wins)))})
                folds.append({'season': year, 'games': len(main), 'trainingGames': len(xtrain),
                              'seedOnly': metrics[0], 'seedSrs': metrics[1],
                              'draft': draft_backtest(ev, baseline, [seed[t] for t in order], wins, rng)})
                print(year, 'Brier seed/SRS', *(round(m['brier'], 4) for m in metrics), flush=True)
        if complete:
            trained_years.append(year)
            for t in order:
                seed_counts[seed[t]] += 1
            for g in main:
                a, b = int(g['WTeamID']), int(g['LTeamID'])
                seed_totals[seed[a]] += 1
                xtrain.append(features(a, b, seed, rating))
                ytrain.append(1)
    if not folds:
        raise ValueError('No complete held-out years')
    summary = {m: {k: float(np.mean([f[m][k] for f in folds])) for k in ['brier', 'logLoss', 'teamWinsMAE']}
               for m in ['seedOnly', 'seedSrs']}
    draft_summary = []
    for population in range(2):
        annual = np.array([[np.mean([s[k] for s in f['draft'][population]['seats']])
                            for k in ['modelWinShare', 'baselineWinShare', 'modelPoints', 'baselinePoints']]
                           for f in folds])
        delta = annual[:, 0] - annual[:, 1]
        boot = rng.choice(delta, size=(5000, len(delta)), replace=True).mean(axis=1)
        draft_summary.append({'opponents': folds[0]['draft'][population]['opponents'],
                              'modelWinShare': float(annual[:, 0].mean()), 'baselineWinShare': float(annual[:, 1].mean()),
                              'pointsDelta': float((annual[:, 2] - annual[:, 3]).mean()),
                              'winShareDeltaCI95': np.quantile(boot, [.025, .975]).tolist()})
    return {'rules': {'players': 8, 'teamsPerPlayer': 8, 'firstFourCounts': False},
            'summary': summary, 'draftSummary': draft_summary, 'folds': folds, 'excluded': excluded,
            'seedHistory': [{'seed': s, 'teams': seed_counts[s], 'wins': seed_totals[s],
                             'expectedWins': seed_totals[s] / seed_counts[s]} for s in range(1, 17)],
            'sources': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(data.glob('*.csv'))},
            'method': 'Expanding-window, fixed C=1, seed difference and regular-season ridge SRS difference /10. '
                      'First Four resolved before draft. 100 paired tie-break draws per seat/population/year. '
                      'CI bootstraps years, not dependent draft repetitions. Excludes incomplete tournaments. '
                      'Historical mirror ends in 2023; refresh with newer Kaggle CSVs before live use.',
            'snapshots': snapshots}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', type=Path, default=ROOT / 'analytics/data/raw')
    parser.add_argument('--start', type=int, default=2005)
    parser.add_argument('--end', type=int, default=2025)
    parser.add_argument('--forecast-year', type=int)
    parser.add_argument('--output', type=Path, default=ROOT / 'src/edge/history.json')
    args = parser.parse_args()
    report = run(args.data_dir, args.start, args.end, args.forecast_year)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, separators=(',', ':'), allow_nan=False) + '\n')
    print(json.dumps({'summary': report['summary'], 'draftSummary': report['draftSummary'],
                      'years': [f['season'] for f in report['folds']]}, indent=2))
