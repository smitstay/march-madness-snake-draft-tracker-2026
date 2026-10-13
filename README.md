# NCAA snake draft tracker

Public React/Vite tracker plus a separate, password-protected draft lab for an
8-player, 8-round snake draft. Every main-bracket win is one point. First Four
wins do not count. The public tracker and private practice drafts use separate
browser storage.

## Build and validate

```sh
npm ci
npm run lint
npm run build
npm run build:edge
npm run test:edge
python -m venv .venv
.venv/bin/pip install -r analytics/requirements.txt
.venv/bin/python -m unittest discover -s analytics -p 'test_*.py'
# Requires nginx and openssl; no Docker required.
npx playwright install --with-deps chromium
python scripts/test_security.py --browser
```

`npm run build` produces **only the public site** in `dist`. GitHub Pages deploys
that directory. The container additionally builds `dist-edge`, serves it at
`/edge/`, and requires HTTP Basic authentication for every private HTML, JS and
CSS request. No public navigation links to the lab. The lab also works when the
public NCAA scoreboard API is unavailable.

## Private access and deployment

1. Merge the app PR and wait for the container workflow to publish
   `ghcr.io/smitstay/ncaa:1.1.0` (also tagged by commit SHA).
2. On a trusted machine, generate an htpasswd entry without exposing your
   password in shell history:
   ```sh
   umask 077
   printf 'taylor:' > users.htpasswd
   openssl passwd -apr1 >> users.htpasswd
   ```
   OpenSSL prompts for and confirms the password. Keep the resulting file
   private; do not put it in Git or the client bundle.
3. In the existing Vault KV store used by `vault-token-store`, set the **ncaa**
   record's **EDGE_HTPASSWD** property to the complete line from that file
   (`taylor:$apr1$...`). Use your normal Vault UI; this task's pod cannot write
   Vault or Kubernetes Secrets. Remove the local file when safely stored.
4. Merge the companion infrastructure PR. It mounts the ExternalSecret
   `ncaa-edge-auth` at `/etc/nginx/edge-auth/users.htpasswd` and selects image
   `1.1.0`. Flux performs deployment. The optional mount keeps the public site
   available if Vault has not been configured; private requests fail closed.
5. Visit `https://ncaa.taytech.io/edge/` and authenticate with username `taylor`
   and your chosen password. Production access must remain behind HTTPS.

No cluster changes or merges are performed by this implementation. Rollback is a
Git revert to the previous image digest/configuration. Password rotation updates
Vault; the non-subPath secret mount receives the refreshed file without an image
rebuild. Browser Basic Auth credentials last until the browser clears them; use a
private browser window on shared devices. This public repository contains the
algorithm and historical research, not a secret strategy. Access control protects
the hosted tool; your private picks remain in your browser.

## Reproduce the historical regression

```sh
.venv/bin/python analytics/refresh.py
OPENBLAS_NUM_THREADS=1 .venv/bin/python analytics/model.py
```

The downloader pins the archive revision, validates CSVs and writes SHA-256
provenance. `analytics/data-manifest.json` records the inputs used for the checked-in
report. Raw CSVs are ignored. Results, model coefficients, bracket-ordered teams,
64×64 matchup matrices, and walk-forward practice snapshots are generated into
`src/edge/history.json`. Rebuild the private bundle after regeneration.

The archive has tournament results **1985–2023**, and an incomplete 2024 regular
season. It is a historical baseline, not current 2027 information. The lab opens a
clearly labeled 2023 practice field; it does not use the public app's placeholder
2027 teams.

## Prepare a real upcoming field

Obtain the latest official [Kaggle NCAA dataset](https://www.kaggle.com/competitions/march-machine-learning-mania-2026/data)
using the competition's download page or authenticated Kaggle CLI after accepting
its terms. For example, `kaggle competitions download -c
march-machine-learning-mania-2026 -p /your/data` retrieves the existing 2026
competition; use the actual next-year competition once published. Do not assume a
future competition or bracket already exists.

Put these extracted CSVs together in a directory:

- `MTeams.csv`
- `MRegularSeasonCompactResults.csv` (complete through Selection Sunday, day 132)
- `MNCAATourneyCompactResults.csv` (history plus completed upcoming First Four)
- `MNCAATourneySeeds.csv` (official upcoming seeds)
- `MNCAATourneySlots.csv` (official upcoming bracket and semifinal pairings)

After the First Four resolves all 64 teams:

```sh
OPENBLAS_NUM_THREADS=1 .venv/bin/python analytics/model.py \
  --data-dir /your/data --end 2026 --forecast-year 2027 \
  --output /tmp/forecast-2027.json
```

Import that JSON in **Import forecast JSON**. This runs in your browser and does
not upload your field or picks to a server. The pipeline fails if the requested
season is missing or a First Four slot is unresolved. The UI rejects incomplete
regular-season snapshots, invalid probabilities, duplicate teams, invalid seed
pairings and training metadata from the forecast year. It recomputes round
probabilities from the matchup matrix. Before the First Four, practice with the
historical fields; this version intentionally does not guess the four winners.

## Draft-day use

Select your seat (names match the existing draft room), then record every pick in
snake order. Undo reverses mistakes. Expected wins is the default ranking. The
seed-average difference highlights teams stronger/weaker than past teams with
the same seed. On your turn, compare simulated league win share and the likely
next pick under seed-order versus model-EV opponents. Simulations use a consistent
bracket, so opponents cannot both advance from the same game. Tied first place
splits win credit; adjust the model if your actual tiebreaker differs.

Export/restore carries the complete private draft and forecast between devices.
Switching seasons restores each saved draft. The public draft room is not modified
or synchronized, so record selections here while following the real draft.

See [research and backtest results](docs/draft-research.md) for evidence and limits.
