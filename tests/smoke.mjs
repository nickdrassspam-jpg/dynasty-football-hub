// Opens the page against the made-up league in fixture.mjs, visits every tab and reports any script error.
// Usage: node tests/smoke.mjs [--team <roster number>] [--no-fc] [--long-names] [--width 390] [--shots <dir>]
// Needs Playwright. A global install works if NODE_PATH points at it: NODE_PATH=$(npm root -g) node tests/smoke.mjs
import { createRequire } from "module";
import { route } from "./fixture.mjs";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
const { chromium } = createRequire(import.meta.url)("playwright");

const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i < 0 ? null : args[i + 1] ?? true };
const team = opt("--team"), noFc = args.includes("--no-fc"), shots = opt("--shots"), width = +(opt("--width") || 1280);
const page0 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../index.html");

const ORIGIN = "http://hub.test/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push("pageerror: " + e.message));
page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text()) });
await page.route("**/*", async r => {
  const url = r.request().url();
  // the page is served from a made-up web address, so browser storage (saved values, saved seasons, your team) works as it does online
  if (url.startsWith(ORIGIN)) return r.fulfill({ status: 200, contentType: "text/html", body: fs.readFileSync(page0, "utf8") });
  if (noFc && url.includes("fantasycalc")) return r.fulfill({ status: 503, body: "down" });
  const body = route(url);
  if (body === undefined) return r.fulfill({ status: 404, body: "not in fixture" });
  return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
});
if (team != null) await page.addInitScript(t => { try { localStorage.setItem("hubTeamV1", JSON.stringify({ league: "1312056868817891328", key: t })) } catch {} }, team === "skip" ? "" : String(900 + +team - 1));
await page.goto(ORIGIN);
await page.waitForFunction(() => typeof S !== "undefined" && S && S.deep, null, { timeout: 60000 });
// every tab, and every section of a tab that holds several, since only one section is drawn at a time
const tabs = await page.evaluate(() => TABS.flatMap(k => MERGE[k] || [k]));
const report = [];
for (const k of tabs) {
  const before = errors.length;
  await page.evaluate(k => showTab(k), k);
  await page.waitForTimeout(150);
  const st = await page.evaluate(() => document.getElementById("status").textContent);
  const empty = await page.evaluate(k => document.getElementById("p-" + k)?.hidden ? -1 : document.getElementById("p-" + k).innerText.trim().length, k);
  if (/Couldn't draw/.test(st)) errors.push(`${k}: ${st}`);
  report.push(`${k.padEnd(10)} ${empty < 40 ? "NEARLY EMPTY " : ""}${errors.length > before ? "ERROR" : "ok"}`);
  if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `${k}.png`), fullPage: true }) }
}
console.log(report.join("\n"));
if (errors.length) { console.log("\nErrors:\n" + [...new Set(errors)].join("\n")); process.exitCode = 1 } else console.log("\nNo script errors.");
await browser.close();
