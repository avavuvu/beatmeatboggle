# scripts

Everything here runs on your machine and never deploys. One rule: **TypeScript owns game logic; Python does statistics and drawing.** Anything that solves a board, scores words, or picks a seed word runs in TS against `src/lib` and writes CSV/JSON to `data/`; Python fits models and plots from that, never re-implementing a game rule.

```
lib/          shared TS: rng, solver, words/ladders/pools, metrics, stats, csv, select (quality floor + retry), generators/
analysis/     real play data: fetch → days → correlations · rerolls · ladders · players (scored csv for viz)
              order (submission order) · wordFeatures (per-word find-rate features) · scoreCheck · retention
generation/   generator research: factorial · summary · practiceBoards · historical-boards.json
seeds/        seed-word candidates for the curated list (candidates.ts → candidates/*.txt)
wordlist/     builds static/wordList.txt; wordfreq export; sources/ is gitignored (see its README)
viz/          python: style.py (shared palette/font) · generation.py · players/{graphs,knowledge,behaviour,replay}.py
              assets/ holds the wordmark rendered from src/components/Logo.svelte (one-off, via @resvg/resvg-js)
data/         gitignored: db exports and generated csv/json
```

Outputs that are the point go to `docs/graphs/`.

## Running

TypeScript, from the repo root with bun:

```
READONLY_DATABASE_URL=... bun run scripts/analysis/fetch.ts    # pulls boards/avas_words/player_words since 2026-09-11
bun run scripts/analysis/days.ts                                # per-day player outcomes + board metrics
bun run scripts/analysis/correlations.ts
bun run scripts/analysis/rerolls.ts                             # ava's rerolls vs what production generated
bun run scripts/analysis/ladders.ts
bun run scripts/analysis/players.ts [--until 2026-07-18]        # scored rows for the player graphs
bun run scripts/analysis/order.ts                               # submission-order stats
bun run scripts/analysis/replay.ts 2026-10-21 [date...]         # top + median game of a day → scripts/data/replay_<date>.json
bun run scripts/analysis/wordFeatures.ts                        # (day, word) rows for the knowledge model
bun run scripts/analysis/scoreCheck.ts                          # stored score vs recomputed
bun run scripts/analysis/retention.ts                           # cohorts, streaks, return by result, board vs return
bun run scripts/generation/factorial.ts 400                     # construction × selection, paired
bun run scripts/generation/summary.ts
bun run scripts/generation/practiceBoards.ts b                  # practice urls for ladder boards
bun run scripts/seeds/candidates.ts 400                         # candidate seed words by category
```

Python, one `pyproject.toml` and one venv for all of it:

```
uv sync --project scripts
uv run --project scripts python scripts/viz/generation.py              # → docs/graphs/generation/
uv run --project scripts python scripts/viz/players/graphs.py [snapshot] # → docs/graphs/players/<date>/
uv run --project scripts python scripts/viz/players/knowledge.py         # fits the find-rate model → docs/graphs/behaviour/K*
uv run --project scripts python scripts/viz/players/behaviour.py         # → docs/graphs/behaviour/{O,R,S}*
uv run --project scripts python scripts/viz/players/replay.py [date] [top|median] [--dark]   # portrait mp4 with sound, ~20 s
uv run --project scripts python scripts/viz/players/replay.py --preview [--words 6]        # 360x640, 15 fps, no audio, ~1–5 s
uv run --project scripts python scripts/viz/players/replay.py --frame 3                    # one png at t = 3 s
uv run --project scripts python scripts/wordlist/build.py [--write]
uv run --project scripts python scripts/wordlist/wordfreq.py
```

## Players viz (`viz/players/`)

Rewritten from `feature/viz` on top of the TS-scored export, so python never scores a game. `analysis/players.ts` writes `data/players.csv` (one row per game: recomputed score, Ava's score, beat-Ava under the row's fair-fight setting and under forced fair fight, country, city, epoch ms) and `data/avas.csv`; `--until <date>` makes a snapshot. `players/graphs.py [snapshot]` geocodes offline (cached in `data/geocode_cache.csv`), downloads the Natural Earth outline once into `data/`, and writes nine graphs plus `summary.txt` to `docs/graphs/players/<date>/`. Flags are cached in `players/flags*/` and committed.

Two snapshots are committed: `2026-07-18` (the data the original branch graphs were made from, restyled) and `2026-10-22`.

Note `player_words.created_at` is a `timestamp` *without* a zone holding UTC wall time; any driver that turns it into a `Date` shifts it into the local zone. `fetch.ts` reads it as epoch milliseconds from postgres for that reason — the original time-of-day graph was off by ten hours.

**Never commit raw player exports.** `feature/viz` has `players_*.csv` in its history; that branch should not be merged as-is.

## Replay (`viz/players/replay.py`)

Everything tunable is in `viz/players/replay.toml`: timing (tap easing, holds), layout, board drawing, the rare-word threshold, colours per theme, the `[bonuses]` table (label, colour and sound for each scoring bonus from `src/lib/scoring`), and the `[sounds]` table mapping each slot (`start`, `tap`, `submit`, `rare`, `seed`, `dirty`, `end`) to a file in `viz/players/sounds/`. A slot whose file is missing gets a synthesised placeholder. `tap` climbs one scale degree per tile along `audio.tap_scale` (semitone offsets within an octave, major by default).

## Seeds (`seeds/`)

`candidates.ts` writes one file per board size and category (`common`, `ladder`, `scrabbly`, `rare`), 400 words each, tab-separated: `word  zipf  fill  note`. `fill` is how many tries the spread fill needed to reach the quality floor (`✗` = never). Delete the lines you don't want; the survivors become the curated seed list.
