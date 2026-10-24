// Saves today's FantasyCalc dynasty values to data/fc/<format>.json, one column per day, so the page can show
// what players and picks were worth on any day since the first run. Run daily by .github/workflows/fc-snapshot.yml.
// Usage: node scripts/fc-snapshot.mjs <Sleeper league id> [...more league ids]
// Each league's format (superflex or not, team count, PPR) picks the FantasyCalc market, the same one the page reads.
import fs from "fs";
import path from "path";

const ids = process.argv.slice(2);
if (!ids.length) { console.error("Give at least one Sleeper league id"); process.exit(1) }
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../data/fc");
const today = new Date().toISOString().slice(0, 10);
const daysBefore = (d, n) => new Date(Date.parse(d) - n * 864e5).toISOString().slice(0, 10);
const getJson = async url => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} from ${url}`); return r.json() };

const done = new Set();
for (const id of ids) {
  const lg = await getJson(`https://api.sleeper.app/v1/league/${id}`);
  // the same format rules as loadFantasyCalc in index.html
  const rp = lg.roster_positions || [], sf = rp.filter(x => x === "QB" || x === "SUPER_FLEX").length >= 2;
  const rec = +(lg.scoring_settings?.rec || 0), ppr = rec >= 1 ? 1 : rec >= .5 ? .5 : 0, nt = lg.total_rosters || lg.settings?.num_teams;
  const key = `${sf ? 2 : 1}qb-${nt}t-${ppr}ppr`;
  if (done.has(key)) continue; done.add(key);
  const raw = await getJson(`https://api.fantasycalc.com/values/current?isDynasty=true&numQbs=${sf ? 2 : 1}&numTeams=${nt}&ppr=${ppr}`);
  const rows = raw.filter(x => x?.player?.sleeperId && +x.value > 0);
  if (rows.length < 50) throw new Error(`Only ${rows.length} values from FantasyCalc for ${key}`);
  // players by Sleeper id, picks by FantasyCalc's own name ("2027 1st", "2027 Pick 1.07"), as the page reads them
  const idOf = x => x.player.position === "PICK" ? String(x.player.name) : String(x.player.sleeperId);
  const file = path.join(dir, key + ".json");
  const h = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { format: key, dates: [], est: [], v: {} };
  const col = d => { let i = h.dates.indexOf(d); if (i < 0) { h.dates.push(d); h.dates.sort(); i = h.dates.indexOf(d); Object.values(h.v).forEach(a => a.splice(i, 0, null)) } return i };
  const put = (k, i, val) => { (h.v[k] ||= Array(h.dates.length).fill(null))[i] = val };
  // the first run also writes an estimate for 30 days earlier from FantasyCalc's 30-day trend, so there is a starting point
  if (!h.dates.length) { const d = daysBefore(today, 30), i = col(d); h.est.push(d); rows.forEach(x => { if (x.trend30Day != null) put(idOf(x), i, Math.max(0, Math.round(x.value - x.trend30Day))) }) }
  const i = col(today);
  if (h.est.includes(today)) h.est = h.est.filter(d => d !== today);
  Object.values(h.v).forEach(a => { while (a.length < h.dates.length) a.push(null) });
  rows.forEach(x => put(idOf(x), i, Math.round(x.value)));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(h));
  console.log(`${key}: ${rows.length} values saved for ${today} (${h.dates.length} days in the file)`);
}
