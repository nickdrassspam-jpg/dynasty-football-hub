# Dynasty Football Hub

League Hub for Swag League Dynasty: a single page (`index.html`) that reads the league live from Sleeper and prices players and picks from FantasyCalc. GitHub Pages serves it at https://nickdrass.com, deployed by `.github/workflows/pages.yml` on every push to `main`.

`methodology.md` is the single source for how every number is calculated. Any change to `index.html` that changes a formula, threshold, data source or tab updates `methodology.md` and the page's How it works tab in the same change.

## Testing

`tests/smoke.mjs` opens the page against a made-up league (`tests/fixture.mjs`), visits every tab and reports any script error. It needs Playwright:

```
NODE_PATH=$(npm root -g) node tests/smoke.mjs [--team <roster number>|skip] [--no-fc] [--long-names] [--width 390] [--shots <dir>]
```

`--team` picks "your team" as if chosen on a first visit, `--no-fc` makes FantasyCalc unreachable, `--long-names` swaps in long team names to check narrow screens, and `--shots` saves a full-page screenshot of each tab. The deploy publishes only `index.html`, `CNAME` and `data/`; the `tests` folder is never served.

## Value history

FantasyCalc only publishes today's values, so `.github/workflows/fc-snapshot.yml` runs `scripts/fc-snapshot.mjs` once a day. It adds the day's dynasty values to `data/fc/<format>.json`, commits it and redeploys. Edit `LEAGUES` in that workflow to save another league's format. Run it by hand from the Actions tab (Save FantasyCalc values, Run workflow) or locally with `node scripts/fc-snapshot.mjs <league id>`.

## Newsletter

The home page reads the newest post from the Substack feed (`NEWS_FEED` in `index.html`) through rss2json.com, since Substack blocks both direct reads from a web page and requests from GitHub's servers, and shows it as a card.
