# League Hub: how the numbers work

> **This file is the single source for how the hub's numbers work.** Any change to `league-hub.html` that changes a formula, threshold, data source or tab updates this file and the page's How it works tab in the same change. How it works stays hand-written in the page because it shows worked examples from live league data, but it must say nothing this file doesn't. Once the hub moves to a GitHub repo, this file lives there next to the page and this project keeps a copy.

League Hub is a single HTML page (`claude/league-hub.html` in this project) that reads Swag League Dynasty (Sleeper league 1312056868817891328) live from Sleeper's public API each time it loads, and prices players and picks from FantasyCalc. It follows each manager back through earlier seasons via `previous_league_id`, up to 8 seasons.

The header shows a **Page version** stamp (build time, Eastern) so a stale copy is easy to spot. A **Back** button in the top-left steps back through the tabs, teams and players opened in the session.

The same explanations, with worked examples from the live league, are on the page's **How it works** tab.

## Layout

Tabs are grouped in two levels:

| Group | Tabs |
|---|---|
| Home | Home |
| This week | Weekly recap, Live scores, Recap export |
| Season | Standings, Playoff race, Power & luck, Contend or rebuild, Schedule, Lineups |
| Teams | Team profile, Roster strength, Head-to-head, Rivalries |
| Drafts | Draft board, Tankathon, Pick capital, Draft recap, Draft lab |
| Trades & Players | Player trades, Pick trades, Trade lab, Trade calculator, Waivers, Player lookup, Player watch |
| History | Record book, Franchise history |
| How it works | How it works |

## Data sources
- **League, rosters, matchups, transactions, winners and losers brackets, drafts:** Sleeper API (`api.sleeper.app/v1`). Each draft is also read from `/draft/{id}` for `slot_to_roster_id`, which says who originally owned each pick.
- **Scoring:** all points come from Sleeper already scored with the league's settings (half PPR, 0.5 per rushing and receiving first down). Each season uses its own settings.
- **Trade values:** FantasyCalc (`api.fantasycalc.com/values/current`) for player and pick prices. Sleeper ADP is the fallback.
- **Player ADP:** Sleeper's projections feed (`api.sleeper.app/projections/nfl/{season}`).
  - Dynasty superflex ADP comes from `adp_dynasty_2qb`.
  - Superflex redraft ADP comes from `adp_2qb`.
  - 1QB leagues use the matching half-PPR, PPR or standard keys instead.
  - If the feed can't be loaded, the page falls back to a unique ranking built from Sleeper's general `search_rank`.
- **Injuries:** `injury_status` from Sleeper's player database.
- **NFL schedule:** `api.sleeper.app/schedule/nfl/regular/{season}` for bye weeks and which games have kicked off.
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

- Each team's weekly score is drawn from a normal distribution. Its mean and spread are shrunk toward the league average with a weight of 3 weeks: mean = (weeks × team average + 3 × league average) ÷ (weeks + 3).
- Seeds go by wins, then points for.
- The bracket uses the league's playoff team count, byes for top seeds, no reseeding, and two-week rounds where set. Once the playoffs start, decided games are kept and only the rest are simulated. If the regular season is over but Sleeper has not filled the bracket yet, the bracket is simulated from the final seeds.
- **Columns on Playoff race:** projected record, playoffs, bye, #1 seed, semifinal, final, title, last place. Each is the share of runs in which it happened.
- **Draft slots:** non-playoff teams pick by lowest max points-for, then playoff teams from the lowest seed up (the Draft board's order). Max points-for is simulated as each week's score plus a draw from that team's usual bench gap, never below zero.
- **If they win / if they lose:** the runs split by next week's result.
- **Odds by week charts:** playoff and title odds as they stood after each completed week. Each past week is re-simulated 1,000 times using only the scores known then, with the same team model, tiebreaks and bracket rules. The latest week uses the main 5,000 runs, so each line ends on the table's number. Once the playoffs are under way a last point, "Now", carries the odds from real bracket results.

## Magic and elimination numbers
Exact arithmetic on wins, ignoring the points tiebreak.

- Magic number = (most wins the first team out can still reach) + 1 − the team's wins.
- Elimination number = (most wins the team can still reach) + 1 − wins of the last team in.

## Live win chance
Projected final = points so far + the usual score of each starter still to play (half of what is left for a starter whose game is in progress). A player's usual score is his average this season in weeks he scored (at least two), then last season's, then an estimate from position and redraft ADP. The win chance is a normal curve on the gap, with spread growing with starters still to play.

- **Matchup view:** clicking a game lines up both starting lineups slot against slot.
- **Colours:** a player whose game is final is green if he scored at or above his usual score and red if below; a player on the field is white; a player yet to play shows his usual score in grey.

## Trade values (first-round equivalents)
Everything is priced in one unit: a generic first-round pick in the next draft is 1.00.

**Primary source: FantasyCalc** (`api.fantasycalc.com/values/current`), which prices players and picks from real trades. The page asks for dynasty values matched to the league: 12 teams, superflex (`numQbs=2`), half PPR. Values are cached in the browser for six hours. The user asked for values to be based primarily on a site that tracks current trades.

### Players
- **Dynasty value** = FantasyCalc `value` ÷ its value for a generic next-year first.
- **Win-now value** = FantasyCalc `redraftValue` ÷ the same figure.
- Players are matched by Sleeper ID. A player FantasyCalc doesn't list is worth zero.

### Picks
Pick prices come straight from FantasyCalc. Nothing is floored or re-scaled, at the user's request (a floor of 1.00 on firsts and fixed ratios for later rounds were tried and removed).

- **Price** = FantasyCalc's value for the pick ÷ its value for a generic next-year first. If the next class is only listed pick by pick, the average of its first-round slots stands in for the generic first.
- **Where the pick lands:** a pick in the next draft is priced by where the team that originally owned it is projected to pick. During the season that is the expected slot from the season simulation; before a game is played, or once the season is over, it is the draft order from the standings (the same season the Draft board uses). A traded pick keeps the original team's projection.
- **Exact slot, or early, mid and late:** if FantasyCalc lists that draft pick by pick ("2027 Pick 1.07", which it does for the class about to be drafted), the projected slot's price is used. Otherwise the pick takes the early, mid or late price: first third of the order is early, middle third mid, last third late. A tier label is shown only when it changed the price.
- **Later drafts** use the generic price for that year and round.
- **Gaps:** a round listed without tiers is scaled by how the early, mid or late first compares with the generic first. A missing year uses the nearest year. A missing round uses the user's ratio for that round applied to FantasyCalc's first.
- **Net value** on Pick capital compares each team with the league-average holding.
- The contender score's future pick input uses these totals.

### Fallback when FantasyCalc can't be reached
The Trade calculator's caption and the How it works tab say which source is in use.

**Players:** Value = 2.2 × e^(−(ADP − 1) ÷ 18) + 1.5 × e^(−(ADP − 1) ÷ 62), using Sleeper dynasty superflex ADP. A player going around 42nd is worth one first. Win-now value runs the same curve on redraft ADP. No ADP means zero.

| Dynasty ADP | 1 | 6 | 12 | 24 | 45 | 75 | 115 | 175 |
|---|---|---|---|---|---|---|---|---|
| Value | 3.70 | 3.05 | 2.45 | 1.65 | 0.93 | 0.49 | 0.24 | 0.09 |

**Picks:** the user's fixed values, from the guidance that firsts are worth far more than seconds and thirds and later are nearly worthless. Net value is then compared against one pick per round per year over the next three drafts, 4.38.

| Pick | Value |
|---|---|
| 1st | 1.00 |
| 2nd | 0.35 |
| 3rd | 0.08 |
| 4th | 0.03 |

## Trade calculator and finder
- **Fair deal:** sides within 10% of the bigger side or within 0.08 firsts, whichever is larger. Values add straight, with no bonus for the best single asset.
- **Finder buyers:** contender score 55 or more, ranking outside the top third at a position for win-now value (two weakest positions).
- **Finder sellers:** contender score 45 or less.
- **Player:** healthy, within two years of the position's cliff age or past it, worth at least 0.35 firsts now, at least 15% better than the buyer's last starter there (QB2, RB3, WR4, TE1).
- **Price:** the cheapest set of up to three of the buyer's picks worth at least 90% of the player's dynasty value; ideas costing over 160% are dropped.

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

- **Best trade pickup** (Player trades): the traded player worth the most today over his share of what the receiving team gave up, at today's values. One-sided deals (a side that received only FAAB or nothing) are left out.
- **Franchise timeline** (Franchise history): each trade is a dot placed by that team's grade (A+ at the top, F at the bottom) and sized by the value that moved. Hovering shows what was got and sent.

## Contender score (0 = full rebuild, 100 = all-in contender)
Each input is converted to a z-score within the league, then the weighted blend is turned into a 0 to 100 score.

| Input | Weight | Notes |
|---|---|---|
| Roster talent | 35% | From Sleeper superflex redraft ADP, summed over the roster. This input still uses ADP, not FantasyCalc. |
| Points per game, last 6 completed weeks | 30% | |
| Best possible lineup per game, same weeks | 10% | Drops with injuries and thin rosters. |
| Future pick value | 15% | More picks leans rebuilding. Uses the pick prices above. |
| Age of top 10 scorers | 10% | Older leans contending. |

- **Injured players** count for 30% of their talent value if out, on IR, PUP or suspended, 60% if doubtful and 90% if questionable.
- **First-round players** are those inside the first 12 picks of Sleeper dynasty superflex ADP, using unique ranks.
- **Labels:** 60 and up is a contender, 40 and under a rebuilder, and anything between is in between.
- **Windows over time** can't rebuild past ADP or pick holdings, so it uses scoring (60%), best lineup (20%) and age of the top scorers (20%) over the trailing six weeks.

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

## Roster strength and Player watch
- **Roster value:** every player's trade value plus future pick value.
- **Value-weighted age:** average age weighted by trade value. A player with no age listed gets one from his birth date, or from his years in the league.
- **NFL exposure:** one NFL team's share of a roster's win-now value; 25% or more is heavy. A stack is a QB with one of his own WRs or TEs, each worth 0.20 or more now.
- **Tenure:** regular-season weeks on a roster without a break; ties are broken by starter points for the team. **Turnover:** share of today's roster not there in week 1 of last season.
- **Stash hits:** rookie picks with three starts or fewer in year one and four or more since, for the drafting team. Sleeper doesn't keep taxi history.
- **Injury report** (Player watch): rostered players with an injury tag worth at least 0.02 firsts now or for the future, ordered by the win-now value their team is missing (70% of it if out, on IR, PUP or suspended, 40% if doubtful, 10% if questionable). The table shows the 40 costliest.
- **Sidelined value:** share of win-now value held by players out, on IR, PUP or suspended.
- **Age cliff** (Player watch): QB 34, RB 27, WR 30, TE 31. Listed when within a year or past it and still worth 0.12 firsts in either value.

## Rivalry score (0 to 100)
Each meeting is weighted by recency (each season back counts 15% less). The five ingredients are:

- **Familiarity:** each meeting adds to it.
- **Competitiveness:** closeness per game, where a 1-point game counts in full, a 20-point game counts half and a 40-point game counts nothing. It is multiplied by 0.4 + 0.6 × series balance.
- **Stakes:** a championship adds 3 extra games' worth, a semifinal or quarterfinal adds 2, a 3rd-place game adds 0.5, and regular-season games between two playoff teams add 0.5.
- **Drama:** each change of series lead adds 1.2, and each game decided by under 5 points adds 0.7.
- **Similar builds:** 1.6 × (build similarity)² × min(1, games ÷ 3) × balance factor.

How they combine:
- **Series balance:** familiarity, stakes, drama and similar builds are multiplied by 0.6 + 0.4 × balance, so a lopsided series counts for less.
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

- **Hit:** a season ranked in the top 24 at his position by points per game for a 1st or 2nd round pick, or in the top 36 for a 3rd or 4th round pick (the user's definition). Points per game leaves out weeks with no points. A season only counts once four of its weeks are played, and the player needs games in at least half of them (never fewer than three, capped at six). Ranks are among players rostered in the league that season.
- **Usual return for a slot:** a smoothed average of points per week over nearby picks (weight e^(−(slots apart ÷ 3)²)), with every class measured over the same number of weeks since its draft.
- **Points over slot:** points per week minus that usual return.
- **Value over slot:** the player's trade value today, in firsts, minus the smoothed average value today of players taken around that slot in the same draft. It stays inside one class so a new class, still priced on hope, is not measured against older ones.
- **Draft grade:** each manager's average value over slot and average points over slot become z-scores against the league, blended 70% value, 30% points (the user asked for value to weigh heavily): A+ at +1.1, A +0.6, B+ +0.25, B down to −0.25, B− −0.6, C −1.1, D −1.6, F below. Best pick and biggest miss are by value over slot.
- **Draft slot against value today:** a scatter of every rookie pick, with each class's slot average as a dashed line.
- **Class tracker:** every class over the number of weeks the newest class has played.
- **The draft, redone** (Draft recap): the class reordered by trade value today, ties by points. A position filter limits the rows shown without changing the redraft slots.

## Tankathon
Next year's draft, for the current season.

- **First round if the season ended today:** the Draft board's order from current standings. Gap to pick above is how much more max points-for a team has than the team one slot earlier. Value is the pick's price at the slot the simulation expects.
- **Max points-for race:** max PF so far and the simulation's projected regular-season finish for each team; teams in the playoffs in more than half the runs are faded.
- **Race for the 1.01:** the share of the 5,000 runs in which each team's own pick landed in each slot, with expected pick and most likely slot.
- **Matchup preview** (opened from Next up on the Schedule tab): win chance = Φ((team mean − opponent mean) ÷ √(team spread² + opponent spread²)). The all-time series counts regular-season and playoff meetings.

## Awards
- **Weekly:** top and lowest score, biggest blowout, nail-biter, upset of the week (by power ranks before the week), luckiest win (lowest winning score if under the median), toughest loss (highest losing score), player of the week, biggest dud (lowest starting QB, RB, WR or TE), bench MVP, power climber.
- **Game of the week:** the upcoming matchup with the lowest rank A + rank B + 2 × the gap.
- **Manager of the week:** the top score.
- **Season:** MVP (most starter points for one team), rookie of the year, best pickup, best trade (most value netted by one team in a single deal, at today's values), best lineup setter (efficiency), luckiest, worst luck, most improved (points per game against the season before), most weekly high scores.
- **Milestones:** next multiple of 10 wins and 1,000 points. **Droughts:** finished seasons since the last playoff appearance or title.

## Franchise record book (Team profile)
Covers every loaded season for the selected manager, whatever the Season filter says.

- **Game records and streaks** count regular-season and playoff games in order; a playoff round played over two weeks is left out because its score covers two games.
- **Best regular season:** best win percentage in a season with at least four games played. **Most points per game in a season** uses the same seasons.
- **Favorite and toughest opponent:** most wins over losses, and most losses over wins, against one manager.
- **Player records:** points scored in this team's starting lineup in the regular season (best game, most starts, best season, top scorer at each position).

## Recap export
A written recap of the week, a manager of the week card and a one-tap image pack. The pack holds the week's recap panels and the power rankings as they stood after that week. For the latest week it adds the power ranking chart, luck, weekly finishes and, while the season is live, the odds table and odds-by-week charts.
