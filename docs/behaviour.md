# How people play

Five analyses on the full play history (2026-04-07 → 2026-10-22, 99,926 deduplicated daily games). Graphs in `graphs/behaviour/`. Reproduce:

```
bun run scripts/analysis/order.ts          # submission order        → O1–O3
bun run scripts/analysis/wordFeatures.ts   # per-word features       → K1–K4 via knowledge.py
bun run scripts/analysis/scoreCheck.ts     # stored vs recomputed    → S1
bun run scripts/analysis/retention.ts      # retention, cohorts      → R1–R5
uv run --project scripts python scripts/viz/players/knowledge.py
uv run --project scripts python scripts/viz/players/behaviour.py
```

Three data facts that shape everything below:

- `words` is stored in the order players submitted, so every game is a timeline.
- `player_id` is per browser and only reliable from 2026-07-31. A "player" below is a browser.
- `created_at` is a zone-less `timestamp` holding UTC; the 10-hour shift noted in `scripts/README.md` applied here too and is fixed.

---

## 1. Submission order (`O1`–`O3`)

**People don't warm up.** Mean word length goes from 3.82 in the first tenth of a game to 4.01 in the last; the share of 6+ submissions goes 4% → 7%. The long word, when it comes, lands on average 41% of the way through — and the seed word 47% of the way through, i.e. mid-game, not as a climax.

**One word in five extends the previous one.** Across 93k games, 20% of consecutive pairs are extensions (`tea → team`), 4% contractions, 2% anagrams, 41% share half their tiles, 32% are a hop to somewhere else. 19% of games contain a chain of three or more consecutive extensions. That's the ladder behaviour, measured: it's already how a fifth of play happens, without the generator doing anything to encourage it.

**The seed word is sometimes the first thing people see.** On 2026-10-02, 25 players submitted `exceptional` as their first word. The replay of the top game (`O3_replay_2026-10-02_top.png`) goes `exceptional → except → exception` and then mines the board in alphabetical-looking runs (`alien, all | entice, client, elite, exile, exit | ale, cite, …`) — someone recalling vocabulary rather than tracing tiles, probably typing.

The replay JSON (`scripts/data/replay_*.json`: letters, words in order, tile paths, transition kinds) is the animation source.

## 2. What players know (`K1`–`K4`)

A weighted logistic model of *P(a word is found)* on 17k (day, word) rows, trained on days before the word generator and tested on the 42 days after.

| | out-of-sample Spearman with the day's median player score, 4×4 |
|---|---|
| findable words on the board (the current floor) | 0.94 |
| maximum possible score | 0.87 |
| **model: expected words found** | **0.95** |
| **model: expected score** | **0.95** |

So the knowledge model is a slightly better board-quality predictor than raw word count, but only slightly — word count was already very good. Its real value is the per-word picture (`K1`):

- Frequency dominates. A 4-letter word at Zipf 2 is found by ~15% of players; at Zipf 5, ~40%. The curve flattens above 5 — everyday words don't get *more* found.
- Each extra letter beyond 4 roughly halves the odds: 5 letters −0.41 log-odds, 6 −0.86, 7 −0.95, 8+ −1.08.
- Plurals of a board word (+0.31), having a shorter board word inside (+0.22), and having more than one path (+0.37 per log-path) all help; each turn in the straightest path hurts (−0.18). Starting on an edge makes no difference.
- 5×5 boards: −0.43 for the same word — more board to search.

`K4` is the long tail: of findable words found by < 0.2% of players, almost all have Zipf < 3. The exceptions are revealing — `aside`, `resort`, `ratio`, `setup`, `onset`, `atop`, `eldest` are common words that nobody found on their day, which is the board hiding them, not the player not knowing them.

Coefficients are in `scripts/data/knowledge_model.json`; the generator could use them to score a board by expected points rather than word count, and the ladder thresholds (Zipf ≥ 3.5 for a rung) sit right where the find-rate curve is still climbing.

## 3. Are the stored scores honest? (`S1`)

The client sends its own score; the DB trusts it. Recomputing from the words:

| since player ids (82k rows) | |
|---|---|
| matches | **93.0%** |
| client lower by a multiple of 4 | 5.3% |
| client higher by exactly 4 | 1.2% |
| Ava's words weren't loaded (every word got the unique +1) | 0.5% |
| words not on the stored board | 0.1% |
| above the board maximum | 3 rows |

**No evidence of cheating.** Every discrepancy has a mundane cause: the ±4 rows are the dirty-word bonus disagreeing — the client hadn't loaded `dirtyWords.txt` (or had a stale copy) — and the 0.5% is the cached-page bug from the audit, concentrated on 12 days. The three "impossible" rows are all from June board mismatches.

The *early* era is different: 33% of rows have words that aren't on the stored board, concentrated on 2026-05-17 → 05-20 and 06-08/09. That's the reconstruction in `historical-boards.json` not matching what was actually served those days, not players — on 06-08 there are rows where all 67 words are "invalid". Any per-word stat before June should be read with that in mind.

Server-side recomputation is still the right fix, but it's a correctness fix, not an urgent anti-cheat one.

## 4. Retention (`R1`–`R5`)

**The funnel.** Of browsers first seen since August, 8–13% play again the next day, 15–31% within a week, 23–37% within 30 days. Both numbers have drifted down steadily week over week (`R1`, right) — the directories listing the game bring in casual traffic, which is fine, but the first-day experience isn't converting it better over time.

**Once someone is in, they stay** (`R3`). Players with 11+ games come back the next day 66–75% of the time and within a week 95%. 2,324 browsers have played 7+ days; 654 have played 30+. Streaks: 7% of browsers have a run of 8+ consecutive days.

**Losing doesn't drive people away much** (`R2`). Among regulars, crushing Ava gives a 75% next-day return and being crushed gives 66–75%; among 2nd/3rd-gamers, 42% vs 27%. The gradient is real but gentle, and experience matters far more than the result.

**Regulars improve slowly** (`R3`): from the 46th percentile on their first game to the 61st by their 30th. Beat-Ava rate climbs with it.

**Does a richer board bring regulars back tomorrow? No.** After removing the weekday effect (Fri→Sat and Sat→Sun returns are ~61% vs ~72% other days) and the time trend (return rates have been drifting down while boards got richer), the correlation between a 4×4 board's word count and regulars' next-day return is about −0.25, and with its 6+ count −0.27. Weakly *negative*, on 56 days. I don't think a richer board actually pushes people away — more likely a residual confound — but there is no support here for the idea that board richness drives retention. Beat-Ava rate (which is what a richer board raises) is ~0 against return. The honest reading: **board quality is a satisfaction lever, not a retention one**, at least on this horizon.

The things that *do* move with return: experience (overwhelmingly), the weekend, and the slow downward drift in new-player conversion.

## 5. New vs returning (`R4`)

Since early August, returning players have been 60–75% of daily play. New-player counts spike with external listings (early September is the biggest) and decay fast; the returning base grows slowly and steadily. The dip in regulars' next-day return on Fridays and Saturdays is the single clearest pattern in the daily series.

---

## What I'd take from this

1. **The first game is the leaky step.** 8–13% next-day return from a first game vs 66–75% from the 11th. What the reveal shows a first-timer — their percentile, "you found 12 of 34 common words" — matters more for growth than the board does.
2. **Use the knowledge model's per-word probabilities for the "words found by X%" stat and for a board's expected score,** but keep word count as the floor — it's nearly as good and far simpler.
