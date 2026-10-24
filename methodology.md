# League Hub: how the numbers work

> **This file is the single source for how the hub's numbers work.** Any change to `index.html` that changes a formula, threshold, data source or tab updates this file and the page's How it works tab in the same change. How it works stays hand-written in the page because it shows worked examples from live league data, but it must say nothing this file doesn't. The file lives in the `dynasty-football-hub` repo next to the page; the project keeps a copy at `knowledge/claude/league-hub-methodology.md`.

League Hub is a single HTML page (`index.html` in the `dynasty-football-hub` repo, deployed by Netlify to https://swagleaguedynastyhub.netlify.app/) that reads Swag League Dynasty (Sleeper league 1312056868817891328) live from Sleeper's public API each time it loads, and prices players and picks from FantasyCalc. It follows each manager back through earlier seasons via `previous_league_id`, up to 8 seasons.

The header shows a **Page version** stamp (build time, Eastern) so a stale copy is easy to spot. A **Back** button in the top-left steps back through the tabs, teams and players opened in the session.

The same explanations, with worked examples from the live league, are on the page's **How it works** tab.

The page is league-wide: any manager can open it, and it has some attitude (lopsided trades are called fleeces).

## Your team
- On the first visit the page asks **"Which team is yours?"** and saves the answer in that browser (`localStorage` key `hubTeamV1`, holding the league id and the manager's Sleeper user id, which carries over between seasons). **Just browsing** skips it and is remembered for that league. The choice can be changed from **Your team** in the header.
- With a team picked, its rows, cards and bracket slots are outlined on every tab, and it is preselected in Team profile, Rivalries (against its rival) and the Trade calculator.
- **Home for a selected team**, in this order, with the section cards below:
  1. **This week's matchup**, shown as a score bug across the top: opponent, records, win chance, and the live score once games start; before kickoff the big numbers are each team's projected score (or expected score) (the win chance from Live scores: before kickoff it compares each team's projected score from the starters set in Sleeper, and Home shows those projections; when NFL game data is unavailable, the expected-score win chance from the matchup preview).
  2. **The stakes:** playoff odds now, if they win this week and if they lose, from the season simulation, plus title odds.
  3. **Lineup problems:** the team's Sleeper starters for the week (or the best lineup on paper when none are set). A starter is flagged when on bye, expected to miss the week (rules under Season simulation), questionable (expected to play, nothing at risk), or the slot is empty. When every flagged starter is questionable, the caption says so instead of quoting points at risk. Points at risk = usual score. The suggested swap is the best healthy bench player who fits the slot; none is suggested once the player's game has started.
  4. **Trade idea:** by label (see Trade calculator and finder). Hidden when nothing fits.
  5. **League buzz:** last week's top score, player of the week, upset of the week (or biggest blowout), lowest score; the game of the week; the three latest graded trades with grades and fleece tags.
- Under the score bug, a headline ticker scrolls each tool's one-line teaser (paused on hover, and shown as a static list for anyone who prefers reduced motion).
- Home ends with **Every section**: one flip card per section (This week, Season, Teams, Drafts, Trades, Players, History, How it works; the Trades & Players tab is split into two cards). The front shows one headline number: your win chance this week, your seed and playoff odds, your power rank, the 1.01 favorite's odds, trades graded, rostered players with an injury tag, the defending champion and the tool count. Without a team, or before the numbers exist, the front falls back to a league-wide number (last week's top score, the standings leader, the most valuable roster). Clicking a card flips it; the back lists the section's tools, each with a key stat read from its teaser, and opens that tool.
- Without a team, Home is the lead, the ticker and the section cards.

## Layout

Tabs are grouped in two levels (21 tabs):

| Group | Tabs |
|---|---|
| Home | Home |
| This week | Weekly recap, Live scores, Recap export |
| Season | Standings, Playoff race, Power & luck, Contend or rebuild, Schedule, Lineups |
| Teams | Team profile, Roster strength, Rivalries |
| Drafts | Next drafts, Past drafts |
| Trades & Players | Trade history, Trade calculator, Waivers, Player lookup, Injuries & age cliff |
| History | Record book |
| How it works | How it works |

Merged tabs keep each old tab as a section and show one section at a time, switched with buttons at the top of the tab. The last section picked is remembered while the page is open:

- **Trade history** = Trade lab + Player trades + Pick trades.
- **Next drafts** = Draft board + Tankathon + Pick capital.
- **Past drafts** = Draft recap + Draft lab.
- **Rivalries** = Rivalries + Head-to-head.

Old links and URL hashes (`#tlab`, `#watch`, `#h2h` and so on) open the parent tab showing that section. The Franchise history tab was removed: its franchise timeline is on the Team profile under Current roster, and its season awards sit under the Trophy room in the Record book, and its milestones and droughts and weekly award tally are at the bottom of the Record book. Old `#history` links open the Record book.

**Images:** every panel has Copy image and Save image buttons. In the Trade lab, each card in Every trade, newest first has its own Copy image and Save image buttons that capture just that trade.

**Long lists:** any table or list (trade cards, pick and player trade lists, transaction feeds) longer than 15 rows shows its top 10, plus any rows for your team, with a Show all button. Sorting a shortened table sorts every row, so the 10 shown are the top of the new order. How it works tables are never shortened.

## Data sources
- **League, rosters, matchups, transactions, winners and losers brackets, drafts:** Sleeper API (`api.sleeper.app/v1`). Each draft is also read from `/draft/{id}` for `slot_to_roster_id`, which says who originally owned each pick.
- **Scoring:** all points come from Sleeper already scored with the league's settings (half PPR, 0.5 per rushing and receiving first down). Each season uses its own settings.
- **Trade values:** FantasyCalc (`api.fantasycalc.com/values/current`) only, for player and pick prices. Sleeper ADP is not used anywhere.
- **Injuries:** `injury_status` from Sleeper's player database (cached in the browser for three hours). Projected return dates come from ESPN's injury feed (`site.api.espn.com/apis/site/v2/sports/football/nfl/injuries`, `details.returnDate`), matched by the ESPN id Sleeper keeps for each player, then by name. That feed lists only each NFL team's 25 latest entries, so for a rostered player with a long-term tag (IR, PUP, NA, DNR, suspended) and no date there, the page reads his ESPN player page (`site.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{id}`, first `injuries[].details.returnDate`), finding his ESPN id with ESPN's player search (`/apis/common/v3/search`, exact name, used only when there is a single NFL match) when Sleeper has none. The feed is unofficial and read defensively; when it fails, the rules below fall back to their no-date versions.
- **Newsletter:** the newest post in the commissioner's Substack feed (`piratenck.substack.com/feed`, or the `NEWSLETTER_FEED` repository variable). Substack doesn't let a web page read the feed directly, so `.github/workflows/newsletter.yml` reads it every two hours with `scripts/newsletter.py`, saves the title, subtitle, date, cover image and link to `data/newsletter.json`, and redeploys when a new post appears. Home shows it as a card linking to the post; nothing shows when the file is missing.
- **NFL schedule:** `api.sleeper.app/schedule/nfl/regular/{season}` for bye weeks and which games have kicked off.
- **Browser cache:** finished seasons are saved in IndexedDB (database `leagueHubHistory`) under a version key (`HIST_V`, now `v1`) that is bumped whenever the page changes what it keeps from a season. The current season and FantasyCalc are fetched fresh on every visit.
- **Waivers:** the league uses waiver priority (`waiver_type` 0), not FAAB. FAAB panels appear only for leagues that bid.

## Game stats
- **Regular season only:** game stats and records ignore playoff games, and the current season counts only completed weeks. Playoff games appear in the bracket, rivalries, titles, the franchise record book and the series record in a Tankathon matchup.
- **All-play:** a team's record if it had played every team every week.
- **Luck:** actual wins minus all-play expected wins.
- **Max points:** each week's best possible lineup from that week's player points, filling the most restrictive slots first.
- **Efficiency:** points scored ÷ max points. **Bench points:** max points − points scored.
- **Playoff appearances** count only once a season's playoffs have started. Sleeper pre-fills the bracket with current seeds, which used to be counted as an appearance.

## Standings
- **Weekly finish:** where each team's score ranked each week.
- **Points for against points against:** a scatter of each team's scoring per game against its opponents' scoring per game, with the league averages as dividing lines and the dot coloured by record.

## Power rankings
100 × (50% season all-play win % + 25% all-play win % over the last 3 weeks + 25% actual win %).

- **Week filter:** rewinds the table to any completed week; each team's move is measured against the week before.
- **Power ranking by week:** every team's rank after each week.
- **Luck** always covers the whole season so far.

## Schedule
- **Strength of schedule, played:** average season points per game of opponents faced.
- **Strength of schedule, remaining:** average power score of opponents still to come.
- **Run-in** (same table, while games are left): expected wins left is the sum of the team's win chance in each remaining game; projected record and chance of missing the playoffs come from the season simulation.
- **Schedule swap:** a team's weekly scores replayed against another team's opponents. When that opponent was the team itself, it plays the schedule's owner.
- **Schedule luck:** real wins minus the average wins across every other team's schedule.

## Season simulation (playoff odds, title odds, draft slots)
One set of 5,000 runs produces all three.

- **Scoring profile:** each team's mean and spread are shrunk toward the league average with a weight of 3 weeks: mean = (weeks × team average + 3 × league average) ÷ (weeks + 3), and the same for the variance.
- **Roster-aware expected score** (current season, when player data loaded): for every remaining week, regular season and playoffs, the page builds the team's best lineup from players' usual scores (see Live win chance), filling the most restrictive slots first from players available that week. Taxi and IR slots are left out. Lineup totals are scaled by one league factor so that their average across teams and the regular-season weeks left equals the league's scoring average. Expected score in week w = 50% × shrunk mean + 50% × factor × best lineup in week w. The spread stays the shrunk spread.
- **Availability by week:**
  - Bye: misses that week only.
  - Out, doubtful or Covid (COV): misses next week, then returns.
  - Questionable: plays.
  - IR, PUP, not active (NA) or did not report (DNR): out until ESPN's projected return date (weeks = ceil(days until return ÷ 7) from next week); with no ESPN date, 4 weeks.
  - Suspended: the rest of the regular season unless ESPN lists a date.
- Each game draws each team's score from a normal distribution with that week's expected score. Playoff rounds use the expected scores for the NFL week or weeks the round is played in.
- Seeds go by wins, then points for.
- The bracket uses the league's playoff team count, byes for top seeds, no reseeding, and two-week rounds where set. Once the playoffs start, decided games are kept and only the rest are simulated. If the regular season is over but Sleeper has not filled the bracket yet, the bracket is simulated from the final seeds.
- **Columns on Playoff race:** projected record, playoffs, bye, #1 seed, semifinal, final, title, last place. Each is the share of runs in which it happened.
- **Draft slots:** non-playoff teams pick by lowest max points-for, then playoff teams from the lowest seed up (the Draft board's order). Max points-for is simulated as each week's score plus a draw from that team's usual bench gap, never below zero.
- **If they win / if they lose:** the runs split by next week's result.
- **Odds by week charts:** playoff and title odds as they stood after each completed week. Each past week is re-simulated 1,000 times using only the scores known then, with the same scoring profile, tiebreaks and bracket rules. Past weeks use scoring alone, because past rosters and injuries aren't known. The latest week uses the main 5,000 runs, so each line ends on the table's number. Once the playoffs are under way a last point, "Now", carries the odds from real bracket results.

## Magic and elimination numbers
Exact arithmetic on wins, ignoring the points tiebreak.

- Magic number = (most wins the first team out can still reach) + 1 − the team's wins.
- Elimination number = (most wins the team can still reach) + 1 − wins of the last team in.

## Live win chance
Projected final = points so far + the usual score of each starter still to play (half of what is left for a starter whose game is in progress). The win chance is a normal curve on the gap, with spread growing with starters still to play. Before NFL game data is available it uses each team's expected score for the week.

**Usual score** (also used by the season simulation, Home's lineup problems, the bye planner and the injury report): the player's average this season in weeks he scored (at least two), then last season's. Otherwise an estimate from FantasyCalc win-now value, ranked within his position: estimate = floor + (top − floor) × e^(−(rank − 1) ÷ spread).

| Position | Top | Floor | Spread |
|---|---|---|---|
| QB | 24 | 8 | 18 |
| RB | 20 | 5 | 20 |
| WR | 19 | 5 | 24 |
| TE | 14 | 4 | 10 |

A QB, RB, WR or TE that FantasyCalc doesn't list gets zero. K gets a flat 8 and DEF 7, since FantasyCalc doesn't value them; any other position gets 6.

- **Matchup view:** clicking a game lines up both starting lineups slot against slot.
- **Colours:** a player whose game is final is green if he scored at or above his usual score and red if below; a player on the field is white; a player yet to play shows his usual score in grey.

## Trade values
Every value, chart and table shows FantasyCalc's own numbers (raw `value` or `redraftValue`), because the worth of a first moves over time. Internally the page divides by FantasyCalc's value for a generic first-round pick in the next draft, so the thresholds below are written as fractions of that first ("0.35 firsts" means 0.35 × today's generic first). How it works shows each threshold converted to today's FantasyCalc number.

**Primary source: FantasyCalc** (`api.fantasycalc.com/values/current`), which prices players and picks from real trades. The page asks for dynasty values matched to the league: 12 teams, superflex (`numQbs=2`), half PPR, no TE premium. FantasyCalc is the only value source. Values are fetched on every visit and the last good copy is saved in the browser (`localStorage`, `fcValsV2:` plus the request URL).

- **When FantasyCalc fails:** the saved copy is used, and the header and value captions say "values from [date]". With no saved copy, the header and every value panel say trade values are unavailable right now; picks are counted but not priced, and the contender score drops its talent input.

### Players
- **Dynasty value** = FantasyCalc `value` ÷ its value for a generic next-year first.
- **Win-now value** = FantasyCalc `redraftValue` ÷ the same figure.
- Players are matched by Sleeper ID. A player FantasyCalc doesn't list is worth zero.
- **First-round players:** the top 12 of FantasyCalc's whole list by dynasty value.
- **Sell-high player:** win-now value ≥ 1.25 × dynasty value and ≥ 0.35 firsts, at any age.

### Picks
Pick prices come straight from FantasyCalc. Nothing is floored or re-scaled, at the user's request (a floor of 1.00 on firsts and fixed ratios for later rounds were tried and removed).

- **Price** = FantasyCalc's value for the pick ÷ its value for a generic next-year first. If the next class is only listed pick by pick, the average of its first-round slots stands in for the generic first.
- **Where the pick lands:** a pick in the next draft is priced by where the team that originally owned it is projected to pick. During the season that is the expected slot from the season simulation; before a game is played, or once the season is over, it is the draft order from the standings (the same season the Draft board uses). A traded pick keeps the original team's projection.
- **Exact slot, or early, mid and late:** if FantasyCalc lists that draft pick by pick ("2027 Pick 1.07", which it does for the class about to be drafted), the projected slot's price is used. Otherwise the pick takes the early, mid or late price: first third of the order is early, middle third mid, last third late. A tier label is shown only when it changed the price.
- **Later drafts** use the generic price for that year and round.
- **Gaps:** a round listed without tiers is scaled by how the early, mid or late first compares with the generic first. A missing year uses the nearest year. A missing round uses a fixed ratio for that round (2nd 0.35, 3rd 0.08, 4th 0.03, later 0.02) applied to FantasyCalc's first.
- **Net value** on Pick capital compares each team with the league-average holding.
- The contender score's future pick input uses these totals.

## Trade calculator and finder
- **Fair deal:** sides within 10% of the bigger side or within 0.08 firsts, whichever is larger. Each side gets a roster-spot adjustment like FantasyCalc's: its best asset counts in full and every other asset counts 0.05 firsts less (a waiver pickup), floored at zero. The raw total is shown under the adjusted one when they differ, and the "to even it out" suggestions use what each asset adds after the adjustment.
- **One set of cutoffs:** the contender-score labels (contender ≥ 60, rebuilder ≤ 40). The old 55/45 finder thresholds are gone.
- **Finder buyers:** contenders and in-between teams (score over 40), ranking outside the top third at a position for win-now value (two weakest positions).
- **Finder sellers:** rebuilders and in-between teams (score under 60). A team never trades with itself.
- **Player:** healthy (not out, IR, PUP or suspended), worth at least 0.35 firsts now and at least 0.06 in dynasty value, at least 15% better than the buyer's last starter there (QB2, RB3, WR4, TE1), and either a veteran (within two years of the position's cliff age or past it) or sell-high. Up to three candidates per need.
- **Price:** the cheapest set of up to three of the buyer's picks worth at least 90% of the player's dynasty value after the roster-spot adjustment, with at most two picks from round 3 or later; ideas costing over 160% (raw) are dropped. This stops offers like three late picks for a starter.
- **Fit** = win-now gain over the buyer's last starter × (buyer's rank at the position ÷ teams). The league-wide list is the 12 best fits, at most two per buyer.
- **Ideas for your team:** a contender gets its best buy, a rebuilder its best sell, an in-between team one of each. Hidden when there is no fair match.

## Trade grades in hindsight
Each side is judged on what it got against what it gave up.

- **Starter points:** points the received players scored in that team's lineup until traded again. For a pick, the drafted player's starter points if the receiving team made the pick.
- **Value now:** today's trade value of everything received, or the pick's current price for unused picks.
- Points share = (points received + 10) ÷ (received + given up + 20).
- Value share = (value received + 0.05) ÷ (received + given up + 0.10).
- Share = points weight × points share + (1 − points weight) × value share.
- Points weight = 25% × (1 − share of the deal's value in picks that cannot score for the team that got them: picks not used yet, or moved on again). Value is always at least 75% of the grade, so player for picks swaps are graded almost entirely on value. With no points on either side, value alone is used. If nothing on either side has any value today, the value half is treated as even and points count for 25%.

| Share | 72%+ | 64%+ | 57%+ | 53%+ | 47%+ | 43%+ | 36%+ | 28%+ | under 28% |
|---|---|---|---|---|---|---|---|---|---|
| Grade | A+ | A | A- | B+ | B | B- | C | D | F |

On the ledger, 53% or more is a win and under 47% is a loss. FAAB is listed but not valued.

- **Fleece:** a graded two-way trade where one side's share is at least 72% and at least 0.5 firsts of value moved (today's value of everything on both sides). The card's verdict reads "X fleeced Y". Trades up to 60 days old are tagged **Fleece**; older ones **Aged into a fleece**, because FantasyCalc only has today's values and the deal may have been fair when made.

- **Best trade pickup** (Player trades): the traded player worth the most today over his share of what the receiving team gave up, at today's values. One-sided deals (a side that received only FAAB or nothing) are left out.
- **Franchise timeline** (Team profile, under Current roster): each trade is a dot placed by that team's grade (A+ at the top, F at the bottom) and sized by the value that moved. Hovering shows what was got and sent.

## Contender score (0 = full rebuild, 100 = all-in contender)
Each input is converted to a z-score within the league, then the weighted blend is turned into a 0 to 100 score.

| Input | Weight | Notes |
|---|---|---|
| Roster talent | 35% | Sum of FantasyCalc win-now values over the roster, with the injury discounts below. Left out when values are unavailable. |
| Points per game, last 6 completed weeks | 30% | |
| Best possible lineup per game, same weeks | 10% | Drops with injuries and thin rosters. |
| Future pick value | 15% | More picks leans rebuilding. Uses the pick prices above. |
| Age of top 10 scorers | 10% | Older leans contending. |

- **Injured players** count for 30% of their talent value if out, on IR, PUP or suspended, 60% if doubtful and 90% if questionable.
- **First-round players** are the top 12 by FantasyCalc dynasty value.
- **Labels:** 60 and up is a contender, 40 and under a rebuilder, and anything between is in between. The trade finder uses the same labels.
- **Windows over time** can't rebuild past trade values or pick holdings, so it uses scoring (60%), best lineup (20%) and age of the top scorers (20%) over the trailing six weeks.

### Contend or rebuild tab
- **Contending or rebuilding:** the contender score table.
- **Now against later:** each team's win-now value against the dynasty value of its players plus its picks, with league averages as dividing lines.
- **Assets by timeline**, one card per team:
  - **Win-now assets:** the four players with the most win-now value.
  - **Building blocks:** the four most valuable players aged 24 or under worth at least 0.10 firsts, plus future firsts for teams that are not contenders.
  - **Chips to cash in** (contenders): players 24 or under worth at least 0.10 firsts more for the future than for this season, plus future firsts.
  - **Veterans to sell** (rebuilders): players at or within a year of the position's cliff age with at least 0.15 firsts of win-now value.
  - Teams in between get up to two of each.
- **Windows over time:** small multiples of each team's contender form by week.

## Roster strength, injuries and the age cliff
- **Roster value:** every player's trade value plus future pick value.
- **Value-weighted age:** average age weighted by trade value. A player with no age listed gets one from his birth date, or from his years in the league.
- **NFL exposure:** one NFL team's share of a roster's win-now value; 25% or more is heavy. A stack is a QB with one of his own WRs or TEs, each worth 0.20 or more now.
- **Tenure:** regular-season weeks on a roster without a break; ties are broken by starter points for the team. **Turnover:** share of today's roster not there in week 1 of last season.
- **Stash hits:** rookie picks with three starts or fewer in year one and four or more since, for the drafting team. Sleeper doesn't keep taxi history.
- **Injury report:** rostered players with an injury tag worth at least 0.02 firsts now or for the future (the floor applies only when values are available), showing win-now and dynasty value. Ranked by **points lost** = usual score × regular-season weeks expected to miss, bye weeks not counted. **Expected back** follows the availability rules under Season simulation and says where the date came from (ESPN date, 4-week estimate, suspension, misses next week). The table shows the 40 costliest; the chart below it, "Estimated points lost to injuries, by team", totals points lost by team.
- **Age cliff:** QB 34, RB 27, WR 30, TE 31. Listed when within a year or past it and still worth 0.12 firsts in either value.

## Rivalry score (0 to 100)
Each meeting is weighted by recency (each season back counts 15% less). The five ingredients are:

- **Familiarity:** each meeting adds to it.
- **Competitiveness:** closeness per game, where a 1-point game counts in full, a 20-point game counts half and a 40-point game counts nothing. It is multiplied by 0.4 + 0.6 × series balance.
- **Stakes:** a championship adds 3 extra games' worth, a semifinal or quarterfinal adds 2, a 3rd-place game adds 0.5, and regular-season games between two playoff teams add 0.5.
- **Drama:** each change of series lead adds 1.2, and each game decided by under 5 points adds 0.7.
- **Arms race** (replaced Similar builds): a bonus for two current teams chasing the same prize right now, whether or not they've met. Title side: the top 6 by power rank after the latest finished week. 1.01 side: the first 6 picks in next draft's order if the season ended after that week (non-playoff teams by lowest max points-for, then playoff teams from the lowest seed up). Weights: #1 = 1, then 5/6, 4/6, 3/6, 2/6, #6 = 1/6. Pair bonus = 4.5 × weight A × weight B when both are on the same side (the larger if both sides apply). Re-scored every week, not decayed and not reduced by series balance. Every pair of current teams is scored, so a pair in an arms race appears before they've met.

How they combine:
- **Series balance:** familiarity, stakes and drama are multiplied by 0.6 + 0.4 × balance, so a lopsided series counts for less.
- **Final score:** 100 × (1 − e^(−raw ÷ 8)).
- **Levels:** 80 and up is a blood feud, 60 bitter rivals, 40 heated, 20 simmering, and under 20 friendly.
- **Trades don't count.** The user's view is that in dynasty, contenders and rebuilders trade with each other, so trade partners aren't rivals.

## Lineups
- **Start/sit misses:** the single bench-for-starter swap that would have gained the most. It cost the game when the team lost by less than that swing.
- **Spread:** standard deviation of weekly scores. **Boom:** a top-quarter finish that week. **Bust:** bottom quarter.
- **Close games:** margins under 5 and under 10. **Blowouts:** 30 or more.
- **Bye planner:** each team's most recent starters, marked by NFL bye week, with their usual scores as points lost.

## Waivers
- **Best pickups:** starter points for that team from the add until the player was dropped or traded.
- **Drop regrets:** starter points for other teams after the drop. Unrostered production can't be seen.
- **Claim battles:** counted from failed claims in Sleeper's transactions. A team is listed once among those who missed out, and never beside its own winning claim.
- **FAAB overpay (bidding leagues only):** winning bid minus one dollar more than the next-highest bid.

## Draft lab and Draft recap
Rookie drafts only; a draft of more than eight rounds is treated as a startup.

- **Slot target** (second grilling): judged each NFL season by points-per-game rank at the position. 1.01 to 1.04: top 12. 1.05 through the 2nd round: top 24. 3rd round on: top 36. Tight ends use half those ranks (6, 12, 18). Points per game leaves out weeks with no points. A season only counts once four of its weeks are played, and the player needs games in at least half of them (never fewer than three, capped at six). Ranks are among players rostered in the league that season.
- **Hit:** a season at or above the slot target.
- **Production score:** per season, (target − rank) ÷ target, clamped to −1…+1; unranked = −1. A pick's production is the average over the NFL seasons since his draft (seasons that produce ranks).
- **Value score:** (dynasty value today − slot value) ÷ slot value, clamped to −1…+1. Slot value is FantasyCalc's price today for next year's pick in the same round and third of the round (early, mid, late by pick in round ÷ teams), falling back to the generic round price.
- **Pick score:** value × w + production × (1 − w), where w by NFL seasons the class has played is 1 before any, 0.8 after one, 0.65 after two, 0.5 after three and 0.3 from four on. Value only when no season has ranks; production only when values are unavailable.
- **Draft grade:** the average pick score of a manager's picks, per class and all-time, on an absolute scale with no curve: A+ ≥ +0.5, A ≥ +0.3, B+ ≥ +0.1, B ≥ −0.1, B− ≥ −0.25, C ≥ −0.45, D ≥ −0.65, F below. A pick always counts for the manager who drafted him, on the player's real finish wherever he's rostered. Best pick and biggest miss are by value against the slot. Replaces points over slot and the z-scored grade.
- **Draft slot against value today:** a scatter of every rookie pick, with each class's slot values as a dashed line.
- **Class tracker:** every class over the number of weeks the newest class has played.
- **The draft, redone** (Draft recap): the class reordered by trade value today, ties by points. A position filter limits the rows shown without changing the redraft slots.

## Tankathon
Next year's draft, for the current season.

- **First round if the season ended today:** the Draft board's order from current standings. Gap to pick above is how much more max points-for a team has than the team one slot earlier.
- **Max points-for race:** max PF so far and the simulation's projected regular-season finish for each team; teams in the playoffs in more than half the runs are faded.
- **Race for the 1.01:** the share of the 5,000 runs in which each team's own pick landed in each slot, with expected pick and most likely slot.
- **Matchup preview** (opened from Next up on the Schedule tab): win chance = Φ((team expected score − opponent expected score) ÷ √(team spread² + opponent spread²)), using each team's expected score for that week. The all-time series counts regular-season and playoff meetings.

## Awards
- **Weekly:** top and lowest score, biggest blowout, nail-biter, upset of the week (by power ranks before the week), luckiest win (lowest winning score if under the median), toughest loss (highest losing score), player of the week, biggest dud (lowest starting QB, RB, WR or TE), bench MVP, power climber.
- **Game of the week:** the upcoming matchup with the lowest rank A + rank B + 2 × the gap.
- **Manager of the week:** the top score.
- **Season:** MVP (most starter points for one team), rookie of the year, best pickup, best trade (most value netted by one team in a single deal, at today's values), fleece of the season (the season's fleece where the winner netted the most value), best lineup setter (efficiency), luckiest, worst luck, most improved (points per game against the season before), most weekly high scores.
- **Milestones:** next multiple of 10 wins and 1,000 points. **Droughts:** finished seasons since the last playoff appearance or title.

## Franchise record book (Team profile)
Covers every loaded season for the selected manager, whatever the Season filter says.

- **Game records and streaks** count regular-season and playoff games in order; a playoff round played over two weeks is left out because its score covers two games.
- **Best regular season:** best win percentage in a season with at least four games played. **Most points per game in a season** uses the same seasons.
- **Favorite and toughest opponent:** most wins over losses, and most losses over wins, against one manager.
- **Player records:** points scored in this team's starting lineup in the regular season (best game, most starts, best season, top scorer at each position).

## Recap export
A written recap of the week, a manager of the week card and a one-tap image pack. The pack holds the week's recap panels and the power rankings as they stood after that week. For the latest week it adds the power ranking chart, luck, weekly finishes and, while the season is live, the odds table and odds-by-week charts.
