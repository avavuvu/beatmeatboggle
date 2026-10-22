import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.patches import FancyBboxPatch

sys.path.insert(0, str(Path(__file__).parent.parent))
import style
from style import DATA, GREEN, INK, INK_LIGHT, MUTED, ORANGE, PAPER, RED, SURFACE

style.apply()
OUT = style.GRAPHS / "behaviour"

def order_position():
    pos = pd.read_csv(DATA / "order_position.csv")
    games = pd.read_csv(DATA / "order_games.csv")
    fig, axes = plt.subplots(1, 3, figsize=(16, 4.6))

    ax = axes[0]
    x = (pos["decile"] + 0.5) * 10
    ax.plot(x, pos["meanLength"], marker="o", color=INK, linewidth=2)
    ax.set_ylim(3.5, 4.3)
    ax.set_xlabel("how far through the game (% of words submitted)")
    ax.set_ylabel("mean word length")
    ax.set_title("Words get (slightly) longer as the game goes on", fontsize=10)
    ax2 = ax.twinx()
    ax2.bar(x, pos["longShare"] * 100, width=8, color=ORANGE, alpha=0.3)
    ax2.set_ylabel("% of submissions that are 6+ letters", color=ORANGE)
    ax2.set_ylim(0, 10)
    ax2.spines["right"].set_visible(True)

    ax = axes[1]
    has = games[games["hasLong"]]
    ax.hist(has["firstLongAt"] * 100, bins=20, color=INK, alpha=0.8)
    ax.set_xlabel("position of the first 6+ word (% through the game)")
    ax.set_ylabel("games")
    ax.set_title(f"When the first long word lands  ({len(has):,} games that found one)", fontsize=10)
    seed = games[games["foundSeed"]]
    ax.axvline(seed["seedAt"].mean() * 100, color=RED, linestyle="--")
    ax.text(seed["seedAt"].mean() * 100 + 1, ax.get_ylim()[1] * 0.9, f"seed word\n(mean, n={len(seed):,})", color=RED, fontsize=8)

    ax = axes[2]
    bins = np.arange(0, 0.75, 0.05)
    ax.hist(games["climbShare"], bins=bins, color=GREEN, alpha=0.8)
    ax.set_xlabel("share of a game's words that extend the previous word")
    ax.set_ylabel("games")
    ax.set_title(f"Climbing: {(games['longestClimb'] >= 3).mean() * 100:.0f}% of games have a 3-rung chain", fontsize=10)
    fig.suptitle("Submission order: every game is a timeline", y=1.02)
    fig.tight_layout()
    style.save(fig, OUT / "O1_submission_order.png")

def order_transitions():
    t = pd.read_csv(DATA / "order_transitions.csv")
    fig, ax = plt.subplots(figsize=(9, 4))
    kinds = ["extension", "contraction", "anagram", "overlap", "hop"]
    colors = {"extension": GREEN, "contraction": "#7cb087", "anagram": ORANGE, "overlap": INK, "hop": MUTED}
    for i, size in enumerate([4, 5]):
        left = 0
        for k in kinds:
            v = t[(t["size"] == size) & (t["kind"] == k)]["share"].iloc[0] * 100
            ax.barh(i, v, left=left, color=colors[k], label=k if i == 0 else None, edgecolor=SURFACE)
            if v > 5:
                ax.text(left + v / 2, i, f"{k}\n{v:.0f}%", ha="center", va="center", fontsize=8, color=SURFACE)
            left += v
    ax.set_yticks([0, 1])
    ax.set_yticklabels(["4×4", "5×5"])
    ax.set_xlim(0, 100)
    ax.set_xlabel("% of consecutive word pairs")
    ax.set_title("What the next word is, relative to the last one")
    ax.text(0, -0.75, "extension: tea → team   contraction: team → tea   overlap: shares half its tiles   hop: somewhere else on the board", fontsize=7.5, color=MUTED)
    style.save(fig, OUT / "O2_transitions.png")

def draw_board(ax, letters, size, path, highlight, dim):
    ax.set_xlim(-0.05, size + 0.05)
    ax.set_ylim(-0.05, size + 0.05)
    ax.set_aspect("equal")
    ax.axis("off")
    for i, letter in enumerate(letters):
        r, c = divmod(i, size)
        y = size - 1 - r
        on = i in path
        used = i in dim
        face = highlight if on else (INK_LIGHT if used else PAPER)
        ax.add_patch(FancyBboxPatch((c + 0.05, y + 0.05), 0.9, 0.9, boxstyle="round,pad=0,rounding_size=0.1", facecolor=face, edgecolor="none"))
        ax.text(c + 0.5, y + 0.5, "Qu" if letter == "q" else letter.upper(), ha="center", va="center", fontsize=9 if size == 5 else 11, fontweight="bold", color=SURFACE if on else INK)
    if len(path) > 1:
        xs = [p % size + 0.5 for p in path]
        ys = [size - 1 - p // size + 0.5 for p in path]
        ax.plot(xs, ys, color=SURFACE, linewidth=2, solid_capstyle="round")
        ax.plot(xs[0], ys[0], "o", color=SURFACE, markersize=4)

def order_replay():
    for date in ["2026-10-02", "2026-10-17"]:
        replay = json.loads((DATA / f"replay_{date}.json").read_text())
        for who, game in replay.items():
            words, paths, kinds = game["words"], game["paths"], game["kinds"]
            n = min(len(words), 24)
            cols = 8
            rows = (n + cols - 1) // cols
            fig, axes = plt.subplots(rows, cols, figsize=(cols * 2.1, rows * 2.4))
            used = set()
            for i in range(rows * cols):
                ax = axes.flat[i]
                if i >= n:
                    ax.axis("off")
                    continue
                path = paths[i] or []
                kind = kinds[i - 1] if i > 0 else None
                color = GREEN if kind == "extension" else RED if words[i] == game["seedWord"] else INK
                draw_board(ax, game["letters"], game["size"], path, color, used)
                used |= set(path)
                ax.set_title(f"{i + 1}. {words[i]}" + (f"  ({kind})" if kind in ("extension", "anagram") else ""), fontsize=8, pad=2)
            fig.suptitle(f"{date} — {who} game, first {n} of {len(words)} words, in the order they were found  (green = extends the previous word, red = the seed word, pale = tiles already used)", y=1.0, fontsize=10)
            fig.tight_layout()
            style.save(fig, OUT / f"O3_replay_{date}_{who}.png")

def retention_cohorts():
    c = pd.read_csv(DATA / "retention_cohorts.csv")
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    horizons = [1, 2, 3, 7, 14, 30]
    ax = axes[0]
    cmap = plt.get_cmap("Blues")
    for i, (_, row) in enumerate(c.iterrows()):
        ys = [row[f"day{h}"] * 100 if pd.notna(row[f"day{h}"]) else np.nan for h in horizons]
        ax.plot(horizons, ys, marker="o", markersize=3, color=cmap(0.3 + 0.7 * i / len(c)), label=f"{row['cohortWeek'][5:]} ({int(row['players']):,})")
    ax.set_xscale("log")
    ax.set_xticks(horizons)
    ax.set_xticklabels([f"d{h}" for h in horizons])
    ax.set_xlabel("days after first game")
    ax.set_ylabel("% of the cohort playing on that exact day")
    ax.set_title("New players: day-N retention by first-seen week", fontsize=10)
    ax.legend(fontsize=6.5, ncol=2, title="cohort week (n)", title_fontsize=7)

    ax = axes[1]
    ax.plot(c["cohortWeek"].str[5:], c["day1"] * 100, marker="o", color=INK, label="play again the next day")
    ax.plot(c["cohortWeek"].str[5:], c["day7any"] * 100, marker="o", color=ORANGE, label="play again within a week")
    ax.plot(c["cohortWeek"].str[5:], c["day30any"] * 100, marker="o", color=GREEN, label="play again within 30 days")
    ax.set_xlabel("week of first game")
    ax.set_ylabel("% of new players")
    ax.set_title("New-player retention is drifting down", fontsize=10)
    ax.tick_params(axis="x", labelsize=7, rotation=45)
    ax.legend(fontsize=8)
    fig.suptitle("Retention (player ids are per browser, so these are lower bounds)", y=1.0)
    fig.tight_layout()
    style.save(fig, OUT / "R1_cohorts.png")

def retention_outcome():
    o = pd.read_csv(DATA / "retention_outcome.csv")
    results = ["< 25% of ava", "25–50%", "50–75%", "75–100%", "beat ava", "crushed ava"]
    exps = ["1st game", "2nd–3rd", "4th–10th", "11th+"]
    colors = [INK_LIGHT, "#7fa3bd", INK, "#1f3f57"]
    fig, ax = plt.subplots(figsize=(11, 5))
    width = 0.2
    for i, exp in enumerate(exps):
        s = o[o["experience"] == exp].set_index("result").reindex(results)
        x = np.arange(len(results)) + (i - 1.5) * width
        ax.bar(x, s["returnRate"] * 100, width, color=colors[i], label=exp)
    ax.set_xticks(range(len(results)))
    ax.set_xticklabels(results, fontsize=9)
    ax.set_xlabel("today's result")
    ax.set_ylabel("% who play again tomorrow")
    ax.set_title("Does losing make people quit?  Next-day return by result and experience")
    ax.legend(title="games played before today", fontsize=8, title_fontsize=8, loc="upper left", bbox_to_anchor=(0, 0.92))
    ax.set_ylim(0, 85)
    style.save(fig, OUT / "R2_return_by_result.png")

def retention_learning():
    l = pd.read_csv(DATA / "retention_learning.csv")
    s = pd.read_csv(DATA / "retention_streaks.csv")
    fig, axes = plt.subplots(1, 2, figsize=(13, 4.5))
    ax = axes[0]
    ax.plot(l["game"], l["meanPercentile"] * 100, marker="o", markersize=3, color=INK, label="score percentile within the day")
    ax.plot(l["game"], l["beatAva"] * 100, marker="o", markersize=3, color=RED, label="% beat Ava")
    ax.axhline(50, color=MUTED, linestyle=":", linewidth=1)
    ax.set_xlabel("nth game")
    ax.set_ylabel("%")
    ax.set_title(f"Do regulars improve?  ({int(l['players'].iloc[0]):,} players with 20+ games)", fontsize=10)
    ax.legend(fontsize=8)
    ax = axes[1]
    ax.bar(s["longestStreak"], s["share"] * 100, color=INK, alpha=0.85)
    for i, (v, n) in enumerate(zip(s["share"], s["players"])):
        ax.text(i, v * 100 + 0.5, f"{int(n):,}", ha="center", fontsize=8)
    ax.set_xlabel("longest run of consecutive days")
    ax.set_ylabel("% of players")
    ax.set_title("Streaks", fontsize=10)
    fig.tight_layout()
    style.save(fig, OUT / "R3_learning_and_streaks.png")

def retention_daily():
    d = pd.read_csv(DATA / "retention_days.csv")
    d["date"] = pd.to_datetime(d["date"])
    fig, axes = plt.subplots(2, 1, figsize=(14, 7), sharex=True)
    ax = axes[0]
    ax.stackplot(d["date"], d["returning"], d["new"], d["unknownAge"], colors=[INK, ORANGE, INK_LIGHT], labels=["returning", "new (first game)", "first seen, but ids were new too"], alpha=0.85)
    ax.set_ylabel("players per day")
    ax.set_title("New vs returning players, since player ids")
    ax.legend(fontsize=8, loc="upper left")
    ax = axes[1]
    ax.plot(d["date"], d["regularReturnRate"] * 100, color=INK, marker="o", markersize=3, linewidth=1, label="regulars (5+ prior games) who play tomorrow")
    ax.plot(d["date"], d["returnRate"] * 100, color=MUTED, marker="o", markersize=2, linewidth=0.8, label="everyone who plays tomorrow")
    weekend = d[d["weekday"].isin(["Friday", "Saturday"])]
    ax.scatter(weekend["date"], weekend["regularReturnRate"] * 100, color=RED, s=14, zorder=3, label="Fri / Sat (tomorrow is a weekend day)")
    ax.set_ylabel("% returning next day")
    ax.legend(fontsize=8, loc="lower left")
    fig.autofmt_xdate()
    style.save(fig, OUT / "R4_new_vs_returning.png")

def retention_board():
    d = pd.read_csv(DATA / "retention_days.csv")
    d = d[(d["size"] == 4) & d["regularResid"].notna()]
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    for ax, col, label in [(axes[0], "boardWords", "findable words on the board"), (axes[1], "len6plus", "words of 6+ letters")]:
        for dice, color in [("clusters", MUTED), ("classic", ORANGE), ("word", INK)]:
            s = d[d["dice"] == dice]
            ax.scatter(s[col], s["regularResid"] * 100, color=color, s=30, alpha=0.8, label=dice, edgecolor=SURFACE, linewidth=0.5)
        rho = d[col].corr(d["regularResid"], method="spearman")
        ax.axhline(0, color=INK, linewidth=0.8)
        ax.set_xlabel(label)
        ax.set_ylabel("regulars' next-day return vs weekday mean (pp)")
        ax.set_title(f"spearman {rho:.2f} (n = {len(d)} 4×4 days; ≈ −0.25 after detrending)", fontsize=10)
        ax.legend(fontsize=8, title="generator")
    fig.suptitle("Does a richer board bring regulars back tomorrow?  No evidence it does.", y=1.0)
    fig.tight_layout()
    style.save(fig, OUT / "R5_board_vs_return.png")

def score_check():
    s = pd.read_csv(DATA / "score_check.csv")
    s = s[~s["challenge"]]
    verdicts = ["match", "client-low", "client-high", "ava-missing-bonus", "invalid-words", "impossible"]
    labels = {
        "match": "matches",
        "client-low": "client lower\n(dirty bonus not loaded)",
        "client-high": "client higher\n(+4, dirty list mismatch)",
        "ava-missing-bonus": "Ava's words\nnot loaded",
        "invalid-words": "words not on\nthe stored board",
        "impossible": "above the board\nmaximum",
    }
    colors = [GREEN, INK_LIGHT, ORANGE, ORANGE, MUTED, RED]
    fig, ax = plt.subplots(figsize=(11, 4.5))
    for i, era in enumerate(["early", "recent"]):
        sub = s[s["era"] == era]
        left = 0
        for v, c in zip(verdicts, colors):
            share = (sub["verdict"] == v).mean() * 100
            ax.barh(i, share, left=left, color=c, edgecolor=SURFACE)
            if share > 3:
                ax.text(left + share / 2, i, f"{share:.1f}%", ha="center", va="center", fontsize=8, color=SURFACE if c in (GREEN, INK) else style.INK)
            left += share
    ax.set_yticks([0, 1])
    ax.set_yticklabels([f"before player ids\n({(s['era'] == 'early').sum():,} rows)", f"since 2026-07-31\n({(s['era'] == 'recent').sum():,} rows)"])
    ax.set_xlim(0, 100)
    ax.set_xlabel("% of stored games")
    ax.set_title("Is the stored score what the words are worth?")
    from matplotlib.patches import Patch

    ax.legend(handles=[Patch(color=c, label=labels[v].replace("\n", " ")) for v, c in zip(verdicts, colors)], fontsize=7, loc="lower right", ncol=2)
    style.save(fig, OUT / "S1_score_check.png")

if __name__ == "__main__":
    order_position()
    order_transitions()
    order_replay()
    retention_cohorts()
    retention_outcome()
    retention_learning()
    retention_daily()
    retention_board()
    score_check()
