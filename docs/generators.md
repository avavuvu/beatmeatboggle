# Generator evaluation

Graphs are in `graphs/generation/`. A first pass compared "current" to a bundle of three changes at once and used metrics that hadn't been validated against real play; this version fixes both. Everything is reproducible:

```
# real play data (read-only; needs READONLY_DATABASE_URL in the environment, see .env.example)
READONLY_DATABASE_URL=... bun run scripts/analysis/fetch.ts 2026-09-11
bun run scripts/analysis/days.ts            # per-day outcomes → scripts/data/play_days.csv
bun run scripts/analysis/correlations.ts    # metric vs outcome correlations
bun run scripts/analysis/rerolls.ts         # your rerolls as revealed preference → scripts/data/rerolls.json
bun run scripts/analysis/ladders.ts         # ladders on real seed words, pool stats

# factorial comparison
bun run scripts/generation/factorial.ts 400 # → scripts/data/factorial.csv, factorial_examples.json
bun run scripts/generation/summary.ts
uv run --project scripts python scripts/viz/generation.py   # → docs/graphs/generation/
```

The generators under test live in `scripts/lib/generators/`. `constructLegacy(..., CURRENT)` reproduces `generateWithWord` byte-for-byte and `constructClassic` reproduces `generateClassic` (both asserted on real dates at the top of `factorial.ts`). "new" in the first version of this document is now called `spread` (spread-out seed path + bag fill).

---

## Part A — what the real data says (42 days, 48,480 player rows since 2026-09-11)

### A1. Which metrics predict how players play? (`A1_metric_validation.png`)

Spearman correlation between a board metric and the median number of words players found that day:

| metric | 4×4 (n=24) | 5×5 (n=12) | verdict |
|---|---|---|---|
| findable words | **0.88** | **0.83** | the metric |
| words of 6+ | **0.62** | **0.62** | real, and it's what predicts whether players find a long word (0.74 / 0.59) |
| 3-letter share | **−0.60** | **−0.62** | real (inverse) |
| plural share | 0.47 | 0.46 | real for word count — but **−0.59 with "beat Ava" on 4×4**: plural-heavy boards are your boards |
| vowels | −0.07 | 0.41 | noise |
| distinct letters | 0.12 | 0.32 | noise |
| hub share | 0.16 | 0.24 | noise |
| weak tiles | 0.22 | −0.03 | noise |
| EE/OO pairs | −0.11 | 0.74 | noise on 4×4; on 5×5 it's just tracking `e` count |

So of the eight "bland signature" metrics in v1, **three are validated and five are not**. Vowel ratio, letter diversity, hub concentration and the EE/OO doubles — the things I built the spread construction around — don't show up in how people actually play. I've dropped them from the floor.

### A2. Your rerolls are a labelled dataset (`A2_revealed_preference.png`)

Since the reroll button shipped on 2026-09-29 you've rerolled **12 of 21 word days** (57%) and 4 of 6 Mondays. Plotting every board you rejected against every board you accepted:

| 4×4 | words | 6+ |
|---|---|---|
| rejected (n=8) | 29, 50, 60, 68, 71, 82, 94, 96 | 2–18 |
| accepted as generated (n=6) | 66, 107, 113, 113, 124, 127 | 7–17 |
| accepted reroll (n=8) | 94–195 | 11–39 |

With one exception (`exceptional`, 66 words — I'd guess you kept it for the word), **you reject below ~100 words and accept above it.** On 5×5 the line is fuzzier (`nauseating` at 221 rejected, `vehicular` at 159 kept) but sits around 200. Your rejected boards do *not* differ from accepted ones on vowels, distinct letters, hub share or EE/OO — which agrees with A1.

That's the floor now: **4×4 ≥ 100 words, ≥ 10 of 6+, ≥ 2 of 7+; 5×5 ≥ 200, ≥ 35, ≥ 8**; plus 3-letter share ≤ 35% and plural share ≤ 30%. It's calibrated to you, not to me.

It also reframes the problem. The current generator produces a board you'd accept **34% of the time on 4×4 and 31% on 5×5** (`pass floor` column, `current/single`). You've been doing the selection by hand, every other day, with a button that only gives you one more roll.

### A3. The seed word is found by 1.5% of players on a median day (`A3_seed_find_rate.png`)

| seed | found by |
|---|---|
| exceptional | 21.9% |
| fluctuated | 13.2% |
| exerciser | 12.4% |
| marshmallow | 7.7% |
| rubbishes | 7.5% |
| … 26 more days … | 0.3–4.2% |
| heterodox | 0.6% |
| interpolate | 0.3% |

5 of 36 days ≥ 5%; 10 of 36 < 1%. The "someone finds `heterodox`" moment is real but it's 7 players out of 1,243. Revealing the seed word afterwards turns that into something every player gets.

Also worth knowing: on an average 4×4 day, 112 of 123 findable words are found by at least 1% of players, but only **16 of 21 six-plus words** are. On 5×5 it's 30 of 60. Half the long words on a 5×5 board are effectively invisible.

---

## Part B — the factorial (`B1`–`B4`)

Two axes, fully crossed, 400 trials per cell per size. Every cell in a trial gets the **same seed word and the same rng**, drawn from the current pool (minus the 0.9% that can't be placed), so differences are attributable.

- **Construction:** `current` (production) · `fixed` (production + the four cheap fixes) · `spread` (spread-out seed path + weighted bag fill)
- **Selection:** `single` (one board, what ships today) · `refill` (same seed word, redraw the fill until the floor passes, ≤40 tries) · `redraw` (new seed word each try)
- plus one extra cell: `spread/redraw` with the **curated pool** (8–10 / 9–12 letters, no plural-only forms)

### Paired deltas in findable words vs `current/single` (`B2_paired_deltas.png`)

| cell | 4×4 Δ (95% CI) | 5×5 Δ (95% CI) |
|---|---|---|
| + cheap fixes, single | +3.5 (0.9 … 6.3) | +4.7 (−1 … 11) |
| spread, single | +3.9 (−0.1 … 7.8) | **+21.8** (13.7 … 30) |
| current, refill | **+27.3** (23.9 … 30.9) | **+53.7** (47.9 … 59.7) |
| + fixes, refill | +28.5 | +57.1 |
| spread, refill | +31.3 | +72.8 |
| current, redraw | +33.9 | +62.0 |
| spread, redraw | +37.9 | +71.2 |
| spread, redraw, curated pool | +35.9 | +78.3 |

Reading it:

1. **Selection is ~85% of the gain on 4×4.** Bolting a retry loop onto the *unchanged* production generator is worth +27 words; swapping the construction on top of that adds +4. On 5×5 the split is closer to 70/30 because the bag fill matters more with 14 free cells.
2. **The cheap fixes are worth +3–5 words and nothing else measurable.** They halve the EE doubles (1.1 → 0.6 per board), which players don't respond to. Still worth doing — they're a correctness fix — but don't expect to feel them.
3. **The spread construction alone is not better than the current one on 4×4** (+3.9, CI includes zero). What it *does* do shows up in `B4_secondary_metrics.png`: vowels pinned to 5–7, EE pairs 1.1 → 0.2, j/q/x/z 0.3 → 0.1, +0.7 distinct letters. All of which are the unvalidated metrics. On 5×5 it's a genuine +22 because the fill has more room to matter.
4. **Redraw beats refill by ~5 words** — some seed words (`bivouacking`, `garrulous`) can't make the floor with any fill; see `C1`. Redraw keeps the seed-word distribution uniform over the pool (rejection sampling), so rare words are as likely as ever; it just skips the ones whose letters can't carry a board.
5. **The curated pool adds +7 on 5×5, nothing on 4×4,** and removes plural seeds (28% → 0%). Its real value is the plural rule you asked for, not word count.
6. **Pass rates:** `current/single` 34% → `current/refill` 98% → anything with `redraw` 100%. Median attempts to pass: 2–3. Cost: 2–8 ms per board.

### The left tail (`B3_floor_tail.png`)

p10 of findable words, 4×4: current 61 → refill 104 → redraw 107. That tail is exactly the set of boards you've been rerolling.

---

## Part C — same seed word, every construction (`C1_same_seed_examples.png`)

Eight seed words (`heterodox`, `bivouacked`, `garrulous`, `aerodrome`, `exceptional`, `hesitated`, `nauseates`, `interpolate`), each laid out by the three constructions with the same rng (columns 1–3), then with refill-selection on the current and spread constructions (columns 4–5).

What it shows that the aggregates don't: **a single draw of any construction is a lottery.** `hesitated` → current 196 words, fixed 178, spread 91. `aerodrome` → current 142, spread 67. `heterodox` → current 65, spread 141. The construction decides the *distribution*; the draw decides the day. That's why selection dominates.

It also shows the failure mode redraw exists for: `bivouacked` under `current/refill` burned all 40 tries and still only reached 84 words; the spread construction found a passing fill on try 9 but only just (116 words, 19 of 6+). Some seed words are the problem, not the fill.

---

---

## Part D — wordless generators and ladders (`D1`, `D2`)

Added after the first round: classic dice + retry, the wordless "bag" fill + retry, and a ladder-weighted seed draw. Reproduce with `scripts/generation/factorial.ts` (16 cells) and `scripts/analysis/ladders.ts`.

### D1. Classic + retry, bag + retry

Wordless boards have fewer long words by nature, so they get their own floor from your Monday rerolls (rejected 15/20/52/81 words, accepted 103+): **4×4 ≥ 90 words, ≥ 4 of 6+, ≥ 1 of 7+**; 5×5 ≥ 180 / 15 / 3.

| 4×4 | median words | p10 | 6+ | pass floor | median tries |
|---|---|---|---|---|---|
| classic / single (Mondays today) | 53 | 22 | 3.9 | 10% | 1 |
| **classic / retry** | **108** | **93** | 13.1 | 97% | 7 |
| bag / single | 79 | 45 | 7.4 | 27% | 1 |
| **bag / retry** | **116** | **93** | 15.2 | 100% | 2 |
| current word / single (for reference) | 99 | 61 | 16.6 | 34% | 1 |

- **Classic + retry fixes Mondays outright.** One Monday in six is currently a 15–30 word board; with the loop p10 goes 22 → 93. It needs ~7 tries because only 10% of classic boards clear the floor, which is still < 2 ms. The boards are still real-dice boards — same letters, same feel — just the top decile of them.
- **The bag is a better wordless generator than the dice** (+26 words single, +8 with retry), with no j/q/x/z and no double vowels, but it is not a better generator than the word one: 6+ words are 15 vs 22–25. If you want a wordless day, bag + retry is the one; it doesn't replace word days.
- On 5×5 the bag + retry reaches 222 words / 38 of 6+ — comparable to current word boards *without* selection (188 / 38), still well below word + selection (242–263 / 56–62).

### D2. Ladders

A family ladder is a chain of nested substrings of the seed word where each rung is a morphological derivation of the next (`except → exception → exceptional`), as opposed to a coincidental substring (`concert → once`). Every substring of the seed is a sub-path of its placement, so rungs are guaranteed findable. A ladder is **good** if it has ≥ 3 rungs and every rung below the top has Zipf ≥ 3.5 (a word people know). The seed word itself may be as rare as you like — `haphazardly 2.5 → haphazard 2.8 → hazard 4.0` is the ideal shape.

On the 36 real days, **min Zipf of the rungs is the best predictor of seed-word find rate I've found (ρ = 0.41)**, ahead of ladder depth (0.32) and well ahead of anything about the board. Seed-word Zipf on its own is −0.05: players don't find common seed words, they find *climbable* ones.

Across the curated pool, 4.6% (4×4) / 6.0% (5×5) of words have a good ladder — 902 / 1,056 words, of which 499 / 634 have a rare top word. Weighting the draw (good ladders ×4, all-prefix ladders ×6, depth-2 with a known rung ×2, everything else ×1) gives:

| | current redraw | ladder-weighted redraw |
|---|---|---|
| boards with a good ladder, 4×4 | 6% | **20%** |
| boards with a good ladder, 5×5 | 8% | **25%** |
| seed word Zipf < 3 (rare), 4×4 | 74% | 61% |
| median words / 6+ | 133 / 24.9 | 130 / 24.0 |

So roughly one day in five becomes a ladder day instead of one in sixteen, rare seeds drop from three-quarters to three-fifths of days, and the boards themselves are unchanged. The ladder pool also drops the 2,097 words with Zipf < 1 (`abnegate`, `acritical`, `adroiter`…) — words not found in a billion-word corpus, which I'd argue aren't "rare", they're noise.

Example draws: `defeated → defeat → feat`, `touristy → tourist → tour`, `numberless → number → numb`, `insanely → insane → sane`, `resigned → resign → sign`, `cashiered → cashier → cash`, `unselfish → selfish → self`.

### Practice boards

`scripts/generation/practiceBoards.ts` generates boards drawn only from good ladders and prints practice URLs; answers go to `scripts/data/practice_<batch>.json`.

## Remaining options

The selection loop, hidden word and ladder reveal, cheap fixes, curated ladder-weighted pool and classic + retry are implemented (`src/lib/server/generation/`). What's left:

1. **Prune the seed list.** Edit the files in `scripts/seeds/candidates/`, concatenate the survivors into `scripts/seeds/list.txt`, and rerun `scripts/seeds/build.ts`; the generator picks it up with no code change.
2. **Spread on 5×5 weekends.** Implemented as a dice but not scheduled. It's a real +20 words on weekends and nothing on weekdays; it's also the one change that alters what boards look like.
3. **Bag as a wordless style.** Implemented, not scheduled; only worth it if you want a wordless day.
4. **Credit wordfreq.** `static/seedPool.json` ships Zipf values derived from wordfreq (CC-BY-SA 4.0), so the about page needs a credit line.

## Caveats

- 36 word days is a small sample for Part A. The strong correlations (words, 6+, 3-letter share) are robust; the "noise" verdicts on vowels/distinct/hub are "no evidence of effect at n=24", not proof of none.
- "Median words found" and "found a 6+ word" are proxies for enjoyment. Retention per day would be the real outcome; `player_id` exists since mid-September so that becomes measurable in a few more weeks.
- The floor numbers come from 21 of your decisions. They'll want revisiting once you've seen what the selection loop produces.
- The dictionary changed on 2026-10-15 (`removed dud words`), which shifts seed-word picks for every date after that (`clerestory` → `clergyman` etc.). `rerolls.ts` uses the pre-change list so the reconstruction matches what you actually saw; `factorial.ts` uses the current list, which is what future boards will use.
