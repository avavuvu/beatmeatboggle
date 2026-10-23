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
bun run scripts/generation/looks.ts 1000                        # boards from every generator, before and now → data/looks.csv
bun run scripts/seeds/candidates.ts 400                         # candidate seed words by category
```

Python, one `pyproject.toml` and one venv for all of it:

```
uv sync --project scripts
uv run --project scripts python scripts/viz/generation.py              # → docs/graphs/generation/
uv run --project scripts python scripts/viz/looks.py                   # what boards look like → docs/graphs/looks/
uv run --project scripts python scripts/viz/players/graphs.py [snapshot] # → docs/graphs/players/<date>/
uv run --project scripts python scripts/viz/players/knowledge.py         # fits the find-rate model → docs/graphs/behaviour/K*
uv run --project scripts python scripts/viz/players/behaviour.py         # → docs/graphs/behaviour/{O,R,S}*
uv run --project scripts python scripts/viz/players/replay.py [date] [top|median] [--dark]   # portrait mp4 with sound, ~20 s
uv run --project scripts python scripts/viz/players/replay.py --preview [--words 6]        # 360x640, 15 fps, no audio, ~1–5 s
uv run --project scripts python scripts/viz/players/replay.py --frame 3                    # one png at t = 3 s
uv run --project scripts python scripts/wordlist/build.py [--write]
uv run --project scripts python scripts/wordlist/wordfreq.py
```
