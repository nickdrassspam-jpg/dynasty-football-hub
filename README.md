# Dynasty Football Hub

League Hub for Swag League Dynasty: a single page (`index.html`) that reads the league live from Sleeper and prices players and picks from FantasyCalc. GitHub Pages serves it at https://nickdrass.com, deployed by `.github/workflows/pages.yml` on every push to `main`.

`methodology.md` is the single source for how every number is calculated. Any change to `index.html` that changes a formula, threshold, data source or tab updates `methodology.md` and the page's How it works tab in the same change.

## Testing

`tests/smoke.mjs` opens the page against a made-up league (`tests/fixture.mjs`), visits every tab and reports any script error. It needs Playwright:

```
NODE_PATH=$(npm root -g) node tests/smoke.mjs [--team <roster number>|skip] [--no-fc] [--long-names] [--width 390] [--shots <dir>]
```

`--team` picks "your team" as if chosen on a first visit, `--no-fc` makes FantasyCalc unreachable, `--long-names` swaps in long team names to check narrow screens, and `--shots` saves a full-page screenshot of each tab. The deploy publishes only `index.html` (plus `CNAME`); the `tests` folder is never served.
