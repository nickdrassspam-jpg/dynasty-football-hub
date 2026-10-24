// A made-up league in the shape of Sleeper's, FantasyCalc's and ESPN's responses, for testing the page offline.
// Nothing here is real data: names, scores and values are generated from a fixed seed.
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());

const NFL = ["ARI","ATL","BAL","BUF","CAR","CHI","CIN","CLE","DAL","DEN","DET","GB","HOU","IND","JAX","KC","LV","LAC","LAR","MIA","MIN","NE","NO","NYG","NYJ","PHI","PIT","SF","SEA","TB","TEN","WAS"];
const LEAGUE_ID = "1312056868817891328", PREV_ID = "1100000000000000001";
const N = 12, CUR = 2026, DONE = 6;

// players
const players = {}, byPos = { QB: [], RB: [], WR: [], TE: [], K: [] };
let pid = 1000;
const counts = { QB: 40, RB: 80, WR: 110, TE: 45, K: 14 };
const INJ = [null, null, null, null, null, null, null, null, "Questionable", "Out", "IR", "Doubtful"];
for (const [pos, n] of Object.entries(counts)) for (let i = 0; i < n; i++) {
  const id = String(pid++), age = 21 + Math.floor(rnd() * 13);
  players[id] = { player_id: id, full_name: `${pos} Player ${i + 1}`, first_name: pos, last_name: `Player ${i + 1}`, position: pos, team: pick(NFL), age, years_exp: Math.max(0, age - 22), search_rank: 10 + Object.keys(players).length * 3, injury_status: i < 30 ? pick(INJ) : null, espn_id: String(4000000 + Number(id)) };
  byPos[pos].push(id);
}
NFL.forEach(t => { players[t] = { player_id: t, position: "DEF", team: t, full_name: t + " Defense" } });
const base = id => { const p = players[id], i = byPos[p.position]?.indexOf(id) ?? 10; return { QB: 24 - i * .35, RB: 17 - i * .18, WR: 16 - i * .12, TE: 12 - i * .2, K: 8, DEF: 7 }[p.position] || 5 };

// rosters: snake-ish allocation
const rosterOf = Array.from({ length: N }, () => []);
for (const pos of ["QB", "RB", "WR", "TE", "K"]) byPos[pos].forEach((id, i) => { if (i < N * { QB: 3, RB: 6, WR: 8, TE: 3, K: 1 }[pos]) rosterOf[i % N].push(id) });
NFL.slice(0, N).forEach((t, i) => rosterOf[i].push(t));
// --long-names gives the teams long real-world names, to check that narrow screens still fit them
const LONG = ["SameShitDifferentToilet", "swag team mommy made it", "Kick Ya Ass and Win Team", "Langhorne Losers", "Soulja Goy Tell 'Em", "Coltraneeeeee", "Bum City Central", "Diamond dogs", "stevebuffardi", "Teezy215", "Team Hole", "tommy0717"];
const longNames = process.argv.includes("--long-names");
const users = Array.from({ length: N }, (_, i) => ({ user_id: String(900 + i), display_name: `manager${i + 1}`, metadata: { team_name: longNames ? LONG[i % LONG.length] : `Team ${String.fromCharCode(65 + i)}` }, avatar: null }));

const SLOTS = ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "SUPER_FLEX", "K", "DEF", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN"];
const ELIG = { QB: ["QB"], RB: ["RB"], WR: ["WR"], TE: ["TE"], K: ["K"], DEF: ["DEF"], FLEX: ["RB", "WR", "TE"], SUPER_FLEX: ["QB", "RB", "WR", "TE"] };
function lineup(ids) {
  const used = new Set(), st = [];
  SLOTS.filter(s => ELIG[s]).forEach(s => { const c = ids.filter(x => !used.has(x) && ELIG[s].includes(players[x].position)).sort((a, b) => base(b) - base(a))[0]; if (c) { used.add(c); st.push(c) } else st.push("0") });
  return st;
}
function schedule(weeks) { // round robin pairs per week
  const out = {};
  for (let w = 1; w <= weeks; w++) { const ids = Array.from({ length: N }, (_, i) => i + 1), r = (w - 1) % (N - 1), rot = [ids[0], ...ids.slice(1).slice(r), ...ids.slice(1).slice(0, r)]; out[w] = Array.from({ length: N / 2 }, (_, m) => [rot[m], rot[N - 1 - m]]) }
  return out;
}
function seasonData(season, weeksPlayed, totalWeeks) {
  const sch = schedule(totalWeeks), weeks = {}, rec = {};
  for (let r = 1; r <= N; r++) rec[r] = { wins: 0, losses: 0, ties: 0, fpts: 0, fpts_against: 0, ppts: 0 };
  for (let w = 1; w <= totalWeeks; w++) {
    weeks[w] = [];
    sch[w].forEach(([a, b], m) => {
      const ent = [a, b].map(r => {
        const ids = rosterOf[r - 1], st = lineup(ids), pp = {};
        ids.forEach(id => { pp[id] = w <= weeksPlayed ? Math.max(0, Math.round((base(id) + gauss() * 6) * 100) / 100) : 0 });
        const spts = st.map(id => pp[id] || 0), pts = Math.round(spts.reduce((x, y) => x + y, 0) * 100) / 100;
        return { roster_id: r, matchup_id: m + 1, points: pts, custom_points: null, starters: st, starters_points: spts, players: ids, players_points: pp };
      });
      weeks[w].push(...ent);
      if (w <= weeksPlayed) { const [x, y] = ent; rec[a].fpts += x.points; rec[a].fpts_against += y.points; rec[b].fpts += y.points; rec[b].fpts_against += x.points; rec[a].ppts += x.points * 1.1; rec[b].ppts += y.points * 1.1; if (x.points > y.points) { rec[a].wins++; rec[b].losses++ } else { rec[b].wins++; rec[a].losses++ } }
    });
  }
  const rosters = Array.from({ length: N }, (_, i) => { const r = rec[i + 1], s = { wins: r.wins, losses: r.losses, ties: 0 }; for (const k of ["fpts", "fpts_against", "ppts"]) { s[k] = Math.floor(r[k]); s[k + "_decimal"] = Math.round((r[k] % 1) * 100) } return { roster_id: i + 1, owner_id: users[i].user_id, players: rosterOf[i], starters: lineup(rosterOf[i]), reserve: [], taxi: i < 3 ? [rosterOf[i].at(-2)] : [], settings: s } });
  return { weeks, rosters };
}
const cur = seasonData(CUR, DONE, 17), prev = seasonData(CUR - 1, 17, 17);
const lgBase = (id, season, prevId, status) => ({ league_id: id, name: "Fixture Dynasty League", season: String(season), status, previous_league_id: prevId, total_rosters: N, roster_positions: SLOTS,
  settings: { playoff_teams: 6, playoff_week_start: 15, playoff_round_type: 0, trade_deadline: 11, waiver_type: 0, taxi_slots: 3, num_teams: N },
  scoring_settings: { rec: .5, rush_fd: .5, rec_fd: .5, pass_td: 4 }, metadata: status === "complete" ? { latest_league_winner_roster_id: "3" } : {} });
const leagues = { [LEAGUE_ID]: lgBase(LEAGUE_ID, CUR, PREV_ID, "in_season"), [PREV_ID]: lgBase(PREV_ID, CUR - 1, null, "complete") };
const winners = [{ r: 1, m: 1, t1: 3, t2: 6, w: 3, l: 6 }, { r: 1, m: 2, t1: 4, t2: 5, w: 4, l: 5 }, { r: 2, m: 3, t1: 1, t2: 3, w: 3, l: 1 }, { r: 2, m: 4, t1: 2, t2: 4, w: 2, l: 4 }, { r: 3, m: 5, t1: 3, t2: 2, w: 3, l: 2, p: 1, t1_from: { w: 3 }, t2_from: { w: 4 } }, { r: 3, m: 6, t1: 1, t2: 4, w: 1, l: 4, p: 3, t1_from: { l: 3 }, t2_from: { l: 4 } }];

// transactions: trades, waivers, a failed claim
const tx = { [LEAGUE_ID]: {}, [PREV_ID]: {} };
let tid = 1;
const addTx = (lg, w, t) => (tx[lg][w] ||= []).push({ transaction_id: String(tid++), status: "complete", leg: w, created: Date.UTC(lg === LEAGUE_ID ? CUR : CUR - 1, 8, 10 + w * 7), status_updated: Date.UTC(lg === LEAGUE_ID ? CUR : CUR - 1, 8, 10 + w * 7), ...t });
addTx(PREV_ID, 3, { type: "trade", roster_ids: [1, 7], adds: { [rosterOf[6][3]]: 1 }, drops: { [rosterOf[6][3]]: 7 }, draft_picks: [{ season: String(CUR + 1), round: 1, roster_id: 1, previous_owner_id: 1, owner_id: 7 }] });
addTx(LEAGUE_ID, 2, { type: "trade", roster_ids: [2, 9], adds: { [rosterOf[8][5]]: 2, [rosterOf[1][9]]: 9 }, drops: { [rosterOf[8][5]]: 9, [rosterOf[1][9]]: 2 }, draft_picks: [{ season: String(CUR + 1), round: 2, roster_id: 2, previous_owner_id: 2, owner_id: 9 }] });
addTx(LEAGUE_ID, 4, { type: "trade", roster_ids: [5, 11], adds: { [rosterOf[10][1]]: 5 }, drops: { [rosterOf[10][1]]: 11 }, draft_picks: [{ season: String(CUR + 1), round: 1, roster_id: 5, previous_owner_id: 5, owner_id: 11 }, { season: String(CUR + 2), round: 1, roster_id: 5, previous_owner_id: 5, owner_id: 11 }] });
addTx(LEAGUE_ID, 3, { type: "waiver", roster_ids: [4], adds: { [byPos.WR[105]]: 4 }, drops: { [rosterOf[3].at(-3)]: 4 }, settings: { waiver_bid: 0 } });
addTx(LEAGUE_ID, 3, { type: "waiver", status: "failed", roster_ids: [6], adds: { [byPos.WR[105]]: 6 }, drops: null });
const traded = [{ season: String(CUR + 1), round: 1, roster_id: 1, previous_owner_id: 1, owner_id: 7 }, { season: String(CUR + 1), round: 2, roster_id: 2, previous_owner_id: 2, owner_id: 9 }, { season: String(CUR + 1), round: 1, roster_id: 5, previous_owner_id: 5, owner_id: 11 }, { season: String(CUR + 2), round: 1, roster_id: 5, previous_owner_id: 5, owner_id: 11 }];

// rookie drafts: 4 rounds of young players
const draftFor = (lg, season, did) => { const young = Object.keys(players).filter(id => players[id].age <= 23 && players[id].position !== "K" && players[id].position !== "DEF").slice(0, 48); const ps = young.map((id, i) => ({ round: Math.floor(i / N) + 1, pick_no: i + 1, draft_slot: (i % N) + 1, roster_id: (i % N) + 1, player_id: id, picked_by: users[i % N].user_id, metadata: { first_name: players[id].first_name, last_name: players[id].last_name, position: players[id].position } })); return { d: { draft_id: did, season: String(season), status: "complete", type: "linear", start_time: Date.UTC(season, 4, 1), settings: { rounds: 4, teams: N }, slot_to_roster_id: Object.fromEntries(Array.from({ length: N }, (_, i) => [i + 1, i + 1])) }, picks: ps } };
const drafts = { [LEAGUE_ID]: draftFor(LEAGUE_ID, CUR, "d26"), [PREV_ID]: draftFor(PREV_ID, CUR - 1, "d25") };

// FantasyCalc: dynasty and redraft values, plus pick prices
const fc = [];
Object.keys(players).filter(id => players[id].position !== "DEF" && players[id].position !== "K").forEach(id => { const p = players[id], b = base(id), youth = Math.max(.4, 1.6 - (p.age - 21) * .09); fc.push({ player: { sleeperId: id, name: p.full_name, position: p.position }, value: Math.max(0, Math.round(b * b * 18 * youth)), redraftValue: Math.max(0, Math.round(b * b * 20)) }) });
[[CUR + 1, [6000, 2300, 900, 400]], [CUR + 2, [5600, 2100, 850, 380]], [CUR + 3, [5200, 2000, 800, 360]]].forEach(([y, v]) => v.forEach((x, i) => { const nm = `${y} ${["1st", "2nd", "3rd", "4th"][i]}`; fc.push({ player: { sleeperId: `FP_${y}_${i + 1}`, name: nm, position: "PICK" }, value: x, redraftValue: 0 }); if (!i) ["Early", "Mid", "Late"].forEach((t, j) => fc.push({ player: { sleeperId: `FP_${y}_1_${t}`, name: `${nm} (${t})`, position: "PICK" }, value: Math.round(x * [1.3, 1, .78][j]), redraftValue: 0 })) }));

// Saved value history (data/fc/<format>.json, written daily by scripts/fc-snapshot.mjs): a day every 4 days back to
// August of last season, values drifting around today's, with the first day marked as an estimate like a first run writes
const fcHistory = (() => {
  const dates = [];for (let t = Date.UTC(CUR - 1, 7, 1); t < Date.UTC(CUR, 9, 20); t += 4 * 864e5) dates.push(new Date(t).toISOString().slice(0, 10));
  const v = {};fc.forEach((x, k) => { v[x.player.position === "PICK" ? x.player.name : x.player.sleeperId] = dates.map((d, i) => Math.round(x.value * (1 + .25 * Math.sin(i / 9 + k)))) });
  return { format: "fixture", dates, est: [dates[0]], v };
})();

// NFL schedule: everyone plays weeks 1-18 except one bye each in weeks 5-14
const nflSched = []; for (let w = 1; w <= 18; w++) { const playing = NFL.filter((t, i) => !(w >= 5 && w <= 14 && (i % 10) + 5 === w)); for (let i = 0; i + 1 < playing.length; i += 2) nflSched.push({ week: w, home: playing[i], away: playing[i + 1], status: w < DONE + 1 ? "complete" : w === DONE + 1 ? "in_game" : "pre_game" }) }

// ESPN injuries: return dates for some IR players
const espnInjuries = { injuries: [{ injuries: Object.values(players).filter(p => p.injury_status === "IR" || p.injury_status === "Out").map((p, i) => ({ status: p.injury_status === "IR" ? "Injured Reserve" : "Out", athlete: { id: p.espn_id, displayName: p.full_name }, details: i % 2 ? { returnDate: new Date(Date.UTC(CUR, 10, 20 + i)).toISOString().slice(0, 10) } : {} })) }] };

// what .github/workflows/newsletter.yml saves from the Substack feed
const newsletter = { publication: "Swag League Weekly", home: "https://example.substack.com", title: "Week 7: Chaos & Carnage", subtitle: "Three upsets, one fleece and a bench MVP", link: "https://example.substack.com/p/week-7", date: "2026-10-21", image: null };
export function route(url) {
  const u = new URL(url), p = u.pathname;
  if (u.host === "hub.test" && p === "/data/newsletter.json") return newsletter;
  if (u.host === "api.sleeper.app") {
    let m;
    if (p === "/v1/state/nfl") return { season: String(CUR), season_type: "regular", week: DONE + 1 };
    if (p === "/v1/players/nfl") return players;
    if ((m = /^\/v1\/league\/(\d+)$/.exec(p))) return leagues[m[1]] ?? null;
    if ((m = /^\/v1\/league\/(\d+)\/users$/.exec(p))) return users;
    if ((m = /^\/v1\/league\/(\d+)\/rosters$/.exec(p))) return (m[1] === LEAGUE_ID ? cur : prev).rosters;
    if ((m = /^\/v1\/league\/(\d+)\/matchups\/(\d+)$/.exec(p))) return (m[1] === LEAGUE_ID ? cur : prev).weeks[m[2]] || [];
    if ((m = /^\/v1\/league\/(\d+)\/transactions\/(\d+)$/.exec(p))) return tx[m[1]]?.[m[2]] || [];
    if ((m = /^\/v1\/league\/(\d+)\/traded_picks$/.exec(p))) return traded;
    if ((m = /^\/v1\/league\/(\d+)\/drafts$/.exec(p))) return [drafts[m[1]].d];
    if ((m = /^\/v1\/league\/(\d+)\/(winners|losers)_bracket$/.exec(p))) return m[1] === PREV_ID && m[2] === "winners" ? winners : [];
    if ((m = /^\/v1\/draft\/(\w+)$/.exec(p))) return Object.values(drafts).find(d => d.d.draft_id === m[1])?.d ?? null;
    if ((m = /^\/v1\/draft\/(\w+)\/picks$/.exec(p))) return Object.values(drafts).find(d => d.d.draft_id === m[1])?.picks ?? [];
    if (p.startsWith("/schedule/nfl/regular/")) return nflSched;
    if (p.startsWith("/projections/nfl/")) return [];
  }
  if (u.host === "api.fantasycalc.com") return fc;
  if (/^\/data\/fc\/[\w.-]+\.json$/.test(p)) return fcHistory;
  if (u.host === "site.api.espn.com") return espnInjuries;
  return undefined;
}
export const fixture = { players, users, LEAGUE_ID, N };
