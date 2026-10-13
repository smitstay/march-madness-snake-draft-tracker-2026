"""Download version-pinned Kaggle-format history; no credentials required."""
import csv
import hashlib
import io
import json
from pathlib import Path
from urllib.request import urlopen

REVISION = 'cc53f5ea4242c351c8781a62b4f5a3f3188ad89a'
BASE = f'https://huggingface.co/Jensen-holm/Nigl/resolve/{REVISION}/data/'
FILES = ['MTeams.csv', 'MRegularSeasonCompactResults.csv', 'MNCAATourneyCompactResults.csv',
         'MNCAATourneySeeds.csv', 'MNCAATourneySlots.csv']


def refresh():
    dest = Path(__file__).parent / 'data/raw'
    dest.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name in FILES:
        url = BASE + name
        data = urlopen(url, timeout=90).read()
        rows = list(csv.DictReader(io.StringIO(data.decode('utf-8-sig'))))
        if not rows or (name != 'MTeams.csv' and 'Season' not in rows[0]):
            raise ValueError(f'Invalid CSV: {name}')
        (dest / name).write_bytes(data)
        manifest[name] = {'url': url, 'sha256': hashlib.sha256(data).hexdigest(), 'rows': len(rows),
                          'lastSeason': max((int(r['Season']) for r in rows if 'Season' in r), default=None)}
        print(name, len(rows))
    (dest / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    refresh()
