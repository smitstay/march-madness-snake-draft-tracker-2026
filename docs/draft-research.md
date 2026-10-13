# Evidence for an equal-win NCAA snake draft

## What the scoring implies

For team T, `E[points(T)] = P(R32) + P(S16) + P(E8) + P(F4) + P(final) + P(title)`.
Use unconditional advancement probabilities from the actual bracket. Championship
odds alone miss early-round value. The sum over the whole 64-team field must be 63.

For a roster, expectations add even when its teams could meet. Subtracting a
second collision penalty from bracket-aware expectations double-counts elimination
risk. Bracket overlap affects covariance and the chance of winning the league;
use joint tournament simulations for that objective. This mathematical distinction
is our derivation for this scoring rule, not a result claimed by the papers below.

Snake position matters: a small advantage now may cost a better pair of teams
across consecutive turns. The private lab completes the remaining snake draft
under explicit opponent assumptions and compares the resulting rosters on the
same 4,000 tournament draws. It reports tied-first-place share, not an estimated
real-world betting probability. Opponent tie breaks use bracket order; adjust the
opponent scenario to see sensitivity. Greedy model-EV is used for your later picks;
this is a one-step lookahead, not an optimal multi-turn game-theory solution.

## Research used

- **Lopez & Matthews (2015), Building an NCAA men's basketball predictive model
  and quantifying its success**, DOI 10.1515/jqas-2014-0058,
  [author paper](https://arxiv.org/abs/1412.0248). Combines logistic models using
  market spreads and possession-based efficiency, and examines luck in tournament
  prediction contests. Motivates simple models, informative inputs and evaluating
  probabilities. Our SRS model is not a replication of their ensemble; market and
  possession data are not included.
- **Glickman & Sonas (2015), Introduction to the NCAA men's basketball prediction
  methods issue**, [journal article](https://www.degruyterbrill.com/document/doi/10.1515/jqas-2015-0013/html).
  Discusses prediction methods and the problem of ratings contaminated by
  tournament outcomes. We use only regular-season games through Selection Sunday
  and train each fold on earlier seasons.
- **Sonas et al., Kaggle March Machine Learning Mania**, [data dictionary](https://www.kaggle.com/competitions/march-machine-learning-mania-2026/data).
  Defines regular-season day cutoff, seeds, IDs, tournament results and bracket
  slots. [Versioned public mirror used here](https://huggingface.co/Jensen-holm/Nigl/tree/cc53f5ea4242c351c8781a62b4f5a3f3188ad89a/data).

## Regression and actual execution

Features: `(opponent seed - team seed)/10` and
`(team regular-season SRS - opponent SRS)/10`. SRS is a ridge fit of score margins
against team indicators and home court; it is **not** possession-adjusted
KenPom/Torvik efficiency. Fit L2 logistic regression with fixed C=1, no intercept,
and mirrored examples so opposite matchup probabilities sum to one. Coefficients
are refitted separately for each held-out year. No parameters were selected by
searching these test results.

Training begins in 1985. Evaluate complete tournaments from 2005 through 2023:
17 tournaments, **1,071 main-bracket games**. No 2020 tournament exists. Exclude
2021 entirely because Oregon/VCU was a no-contest and the results file has only
62 main-bracket games. First Four outcomes resolve the draft field before the
main tournament; none of those wins count, train the regression or update SRS.

| Held-out metric | Seed-only regression | Seed + SRS regression |
|---|---:|---:|
| Brier score (lower better) | 0.1920 | **0.1847** |
| Log loss (lower better) | 0.5631 | **0.5443** |
| Team total-wins MAE | 0.7391 | **0.7162** |

Paired historical draft test: one model-EV drafter, seven simulated opponents,
all eight seats, 100 random tie-break repetitions per seat/year/population. Score
rosters against **actual historical tournament wins**. Comparator drafts by seed
average wins learned from strictly earlier years. Ties share first-place credit.
Repeated drafts of one tournament are not independent observations; the 95%
interval below bootstraps the 17 tournament years, not the 13,600 draft runs.

| Opponent policy | Model win share | Baseline win share | Extra points | 95% interval, win-share improvement |
|---|---:|---:|---:|---:|
| Seed order | 19.95% | 10.75% | +1.19 | +2.14 to +16.45 percentage points |
| Historical seed EV | 21.97% | 12.39% | +1.25 | +1.75 to +17.70 percentage points |

These results support team-specific ranking over seed-only drafting in these
historical scenarios. They do **not** establish a 20–22% chance against your
actual friends. The last two tested tournaments, 2022 and 2023, had worse Brier
scores with SRS than seed-only (0.2264 vs 0.2194; 0.2071 vs 0.2048). Modern-era
performance needs fresh validation; the mirror has no 2024–2026 outcomes. No
injury, roster-availability, current betting-market, or NIL/transfer adjustment is
modeled. The live win-share lookahead has not itself been historically backtested;
the table tests greedy expected-wins drafting.

## Practical strategy

1. Rank by expected total wins and bracket path. Choose the best available
   probability-weighted points rather than making an emotional upset pick.
2. Compare your likely next turn, particularly at the snake endpoints. Check both
   opponent policies; narrow simulated differences are not reliable signals.
3. Favor team strength relative to seed and opponent quality. An 8/9 winner faces
   a 1-seed next; that can make a strong 10/11 seed competitive in expected wins.
4. Use roster-aware win-share simulations for risk decisions. Do not mechanically
   penalize teams just because you own another team from the same region.
5. Before real drafting, update to the official field and fresh regular-season
   data. Verify meaningful injuries separately. Timestamped market/efficiency
   inputs are a useful next model candidate, but only retain them after a new
   chronological backtest. No paid-data credentials or scraping bypasses needed
   for the implemented baseline.
