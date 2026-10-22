import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.patches import FancyBboxPatch

sys.path.insert(0, str(Path(__file__).parent))
import style
from style import DATA, GREEN, INK, MUTED, ORANGE, RED, SURFACE

style.apply()

OUT = style.GRAPHS / "generation"
OUT.mkdir(parents=True, exist_ok=True)

COLORS = {"current": RED, "fixed": ORANGE, "spread": INK}
LABELS = {"current": "current", "fixed": "+ cheap fixes", "spread": "spread + bag fill"}

fact = pd.read_csv(DATA / "factorial.csv")
fact["len3Share"] = fact["len3"] / fact["words"]
days = pd.read_csv(DATA / "play_days.csv")
rerolls = json.loads((DATA / "rerolls.json").read_text())
examples = json.loads((DATA / "factorial_examples.json").read_text())
meta = json.loads((DATA / "factorial_meta.json").read_text())
floors = {int(k): v for k, v in meta["floors"].items()}

def save(fig, name):
    style.save(fig, OUT / name)

def metric_validation():
    word = days[days["dice"] == "word"]
    metrics = [
        ("words", "findable words"),
        ("len6plus", "words of 6+"),
        ("len3Share", "3-letter share"),
        ("pluralShare", "plural share"),
        ("vowels", "vowels"),
        ("distinct", "distinct letters"),
        ("hubShare", "hub share"),
        ("weakTiles", "weak tiles"),
        ("eeoo", "EE/OO pairs"),
    ]
    fig, axes = plt.subplots(2, 1, figsize=(10, 7))
    for ax, size in zip(axes, [4, 5]):
        sub = word[word["size"] == size]
        rho_words = [sub[m].rank().corr(sub["medianWords"].rank()) for m, _ in metrics]
        rho_six = [sub[m].rank().corr(sub["has6"].rank()) for m, _ in metrics]
        x = np.arange(len(metrics))
        ax.bar(x - 0.18, rho_words, 0.36, color=INK, label="vs median words found per player")
        ax.bar(x + 0.18, rho_six, 0.36, color=GREEN, alpha=0.8, label="vs % of players who found a 6+ word")
        ax.axhline(0, color=INK, linewidth=0.8)
        ax.axhspan(-0.3, 0.3, color=MUTED, alpha=0.08, linewidth=0)
        ax.set_xticks(x)
        ax.set_xticklabels([l for _, l in metrics], fontsize=8, rotation=20, ha="right")
        ax.set_ylim(-1, 1)
        ax.set_ylabel("Spearman rho")
        ax.set_title(f"{size}×{size}  (n = {len(sub)} real days, {int(sub['players'].sum()):,} players)", fontsize=10)
        ax.legend(fontsize=8, loc="lower left")
    fig.suptitle("Which board metrics predict how players actually play?  (grey band = noise)", y=0.98)
    fig.tight_layout()
    save(fig, "A1_metric_validation.png")

def revealed_preference():
    word = [r for r in rerolls if r["dice"] == "word" and r["date"] >= "2026-09-29"]
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    for ax, size in zip(axes, [4, 5]):
        sub = [r for r in word if r["size"] == size]
        rejected = [r["original"] for r in sub if r["rerolled"]]
        accepted_gen = [r["accepted"] for r in sub if not r["rerolled"]]
        accepted_re = [r["accepted"] for r in sub if r["rerolled"]]
        for group, color, label, marker in [
            (rejected, RED, "rejected (you rerolled it)", "x"),
            (accepted_gen, INK, "accepted as generated", "o"),
            (accepted_re, GREEN, "accepted reroll", "o"),
        ]:
            ax.scatter([m["words"] for m in group], [m["len6plus"] for m in group], color=color, label=label, marker=marker, s=70, alpha=0.85, linewidths=2)
            for m in group:
                ax.annotate(m["seedWord"], (m["words"], m["len6plus"]), fontsize=6.5, xytext=(4, 3), textcoords="offset points", color=color)
        ax.axvline(floors[size]["words"], color=MUTED, linestyle="--", linewidth=1)
        ax.axhline(floors[size]["len6plus"], color=MUTED, linestyle="--", linewidth=1)
        ax.set_xlabel("findable words")
        ax.set_ylabel("words of 6+ letters")
        ax.set_title(f"{size}×{size} word days since the reroll button (2026-09-29)", fontsize=10)
        ax.legend(fontsize=8, loc="upper left")
    fig.suptitle("Your revealed preference: every board you rerolled was below the dashed floor", y=1.0)
    fig.tight_layout()
    save(fig, "A2_revealed_preference.png")

def seed_find_rate():
    word = days[days["dice"] == "word"].sort_values("foundSeed", ascending=False)
    fig, ax = plt.subplots(figsize=(13, 4.5))
    colors = [GREEN if f == "base" else INK if f in ("ing", "ed", "er", "ly") else ORANGE for f in word["seedInflection"]]
    ax.bar(range(len(word)), word["foundSeed"] * 100, color=colors)
    ax.set_xticks(range(len(word)))
    ax.set_xticklabels(word["seedWord"], rotation=90, fontsize=7)
    ax.set_ylabel("% of players who found it")
    ax.axhline(5, color=MUTED, linestyle="--", linewidth=1)
    ax.text(len(word) - 0.5, 5.3, "5%", color=MUTED, ha="right", fontsize=8)
    med = word["foundSeed"].median() * 100
    ax.axhline(med, color=RED, linestyle=":", linewidth=1)
    ax.text(len(word) - 0.5, med + 0.3, f"median {med:.1f}%", color=RED, ha="right", fontsize=8)
    from matplotlib.patches import Patch

    ax.legend(handles=[Patch(color=GREEN, label="base word"), Patch(color=INK, label="-ing / -ed / -er / -ly"), Patch(color=ORANGE, label="plural")], fontsize=8)
    ax.set_title("How many players find the seed word?  (36 real days)")
    save(fig, "A3_seed_find_rate.png")

CELL_ORDER = [
    ("current", "single"),
    ("fixed", "single"),
    ("spread", "single"),
    ("current", "refill"),
    ("fixed", "refill"),
    ("spread", "refill"),
    ("current", "redraw"),
    ("fixed", "redraw"),
    ("spread", "redraw"),
]
SEL_LABEL = {"single": "one board\n(today)", "refill": "retry fill until\nfloor, same word", "redraw": "retry with new\nword until floor"}

def cell_rows(size, construction, selection, pool="placeable"):
    return fact[(fact["size"] == size) & (fact["construction"] == construction) & (fact["selection"] == selection) & (fact["pool"] == pool)]

def cell(size, label):
    return fact[(fact["size"] == size) & (fact["cell"] == label)]

def factorial_grid():
    fig, axes = plt.subplots(2, 3, figsize=(14, 7.5), sharey="row")
    for row, size in enumerate([4, 5]):
        for col, selection in enumerate(["single", "refill", "redraw"]):
            ax = axes[row][col]
            data = [cell_rows(size, c, selection)["words"].to_numpy() for c in ["current", "fixed", "spread"]]
            parts = ax.violinplot(data, showmedians=True, widths=0.8)
            for body, c in zip(parts["bodies"], ["current", "fixed", "spread"]):
                body.set_facecolor(COLORS[c])
                body.set_alpha(0.55)
            for key in ("cmedians", "cbars", "cmins", "cmaxes"):
                parts[key].set_color(INK)
                parts[key].set_linewidth(1)
            ax.axhline(floors[size]["words"], color=MUTED, linestyle="--", linewidth=1)
            ax.set_xticks([1, 2, 3])
            ax.set_xticklabels(["current", "+ fixes", "spread"], fontsize=9)
            for i, d in enumerate(data):
                ax.text(i + 1, ax.get_ylim()[1] * 0.98 if row == 0 else np.max(d), f"{int(np.median(d))}", ha="center", va="top", fontsize=8, color=COLORS[["current", "fixed", "spread"][i]])
            if row == 0:
                ax.set_title(SEL_LABEL[selection], fontsize=10)
            if col == 0:
                ax.set_ylabel(f"{size}×{size}: findable words")
    fig.suptitle("Construction (columns within panel) × selection (panels). Same seed words and rng in every cell.", y=0.99)
    fig.text(0.5, 0.01, "dashed = floor calibrated to your rerolls (100 words on 4×4, 200 on 5×5)", ha="center", fontsize=8, color=MUTED)
    fig.tight_layout(rect=(0, 0.02, 1, 0.97))
    save(fig, "B1_factorial_grid.png")

def paired_deltas():
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    for ax, size in zip(axes, [4, 5]):
        base = cell_rows(size, "current", "single").set_index("trial")["words"]
        labels, means, los, his, colors = [], [], [], [], []
        rng = np.random.default_rng(1)
        for c, s in CELL_ORDER[1:]:
            d = (cell_rows(size, c, s).set_index("trial")["words"] - base).to_numpy()
            boots = [rng.choice(d, len(d)).mean() for _ in range(1000)]
            labels.append(f"{LABELS[c]}\n{s}")
            means.append(d.mean())
            los.append(d.mean() - np.percentile(boots, 2.5))
            his.append(np.percentile(boots, 97.5) - d.mean())
            colors.append(COLORS[c])
        pool_d = (cell_rows(size, "spread", "redraw", "curated4" if size == 4 else "curated5").set_index("trial")["words"] - base).to_numpy()
        boots = [rng.choice(pool_d, len(pool_d)).mean() for _ in range(1000)]
        labels.append("spread + bag fill\nredraw + curated pool")
        means.append(pool_d.mean())
        los.append(pool_d.mean() - np.percentile(boots, 2.5))
        his.append(np.percentile(boots, 97.5) - pool_d.mean())
        colors.append(GREEN)
        y = np.arange(len(labels))
        ax.barh(y, means, xerr=[los, his], color=colors, alpha=0.85, capsize=3, error_kw={"ecolor": INK, "linewidth": 1})
        for yi, m, h in zip(y, means, his):
            ax.text(m + h + 1.5, yi, f"+{m:.0f}", va="center", fontsize=8)
        ax.set_yticks(y)
        ax.set_yticklabels(labels, fontsize=7.5)
        ax.invert_yaxis()
        ax.axvline(0, color=INK, linewidth=0.8)
        ax.set_xlabel("delta findable words vs current/single (paired, mean ± 95% CI)")
        ax.set_title(f"{size}×{size}", fontsize=10)
        for sep in [1.5, 4.5, 7.5]:
            ax.axhline(sep, color=MUTED, linewidth=0.5, linestyle=":")
    fig.suptitle("How much does each change contribute?  (bars within a group differ only by construction)", y=1.0)
    fig.tight_layout()
    save(fig, "B2_paired_deltas.png")

def floor_tail():
    fig, axes = plt.subplots(1, 2, figsize=(13, 4.5))
    for ax, size in zip(axes, [4, 5]):
        hi = int(fact[fact["size"] == size]["words"].quantile(0.995))
        bins = np.linspace(0, hi, 45)
        for (c, s), color, alpha in [
            (("current", "single"), RED, 0.45),
            (("current", "refill"), ORANGE, 0.45),
            (("spread", "redraw"), INK, 0.45),
        ]:
            vals = cell_rows(size, c, s)["words"]
            ax.hist(vals, bins=bins, alpha=alpha, color=color, label=f"{LABELS[c]} / {s}   p10 = {int(vals.quantile(0.1))}")
        ax.axvline(floors[size]["words"], color=MUTED, linestyle="--", linewidth=1)
        ax.set_title(f"{size}×{size}", fontsize=10)
        ax.set_xlabel("findable words")
        ax.set_ylabel("boards")
        ax.legend(fontsize=8)
    fig.suptitle("The left tail is what you've been rerolling by hand", y=1.0)
    fig.tight_layout()
    save(fig, "B3_floor_tail.png")

def secondary_metrics():
    metrics = [("len6plus", "words of 6+"), ("len3Share", "3-letter share"), ("vowels", "vowels on board"), ("distinct", "distinct letters"), ("adjEE", "adjacent E–E pairs"), ("rare", "j/q/x/z tiles")]
    fig, axes = plt.subplots(2, 3, figsize=(14, 7))
    cells = [("current", "single"), ("fixed", "single"), ("spread", "single"), ("current", "refill"), ("spread", "redraw")]
    names = ["current\nsingle", "+ fixes\nsingle", "spread\nsingle", "current\nrefill", "spread\nredraw"]
    for ax, (m, title) in zip(axes.flat, metrics):
        data = [cell_rows(4, c, s)[m].to_numpy() for c, s in cells]
        parts = ax.violinplot(data, showmedians=True, widths=0.8)
        for body, (c, _) in zip(parts["bodies"], cells):
            body.set_facecolor(COLORS[c])
            body.set_alpha(0.55)
        for key in ("cmedians", "cbars", "cmins", "cmaxes"):
            parts[key].set_color(INK)
            parts[key].set_linewidth(1)
        ax.set_xticks(range(1, len(cells) + 1))
        ax.set_xticklabels(names, fontsize=7.5)
        ax.set_title(title, fontsize=10)
        for i, d in enumerate(data):
            ax.text(i + 1, np.max(d), f"{np.mean(d):.2g}", ha="center", va="bottom", fontsize=7, color=COLORS[cells[i][0]])
    fig.suptitle("Secondary metrics, 4×4 — what construction changes that selection doesn't", y=1.0)
    fig.tight_layout()
    save(fig, "B4_secondary_metrics.png")

def draw_board(ax, letters, size, path, title, subtitle, color):
    ax.set_xlim(-0.1, size + 0.1)
    ax.set_ylim(-0.35, size + 0.1)
    ax.set_aspect("equal")
    ax.axis("off")
    for i, letter in enumerate(letters):
        r, c = divmod(i, size)
        y = size - 1 - r
        on_path = i in path
        ax.add_patch(FancyBboxPatch((c + 0.06, y + 0.06), 0.88, 0.88, boxstyle="round,pad=0,rounding_size=0.12", facecolor=color if on_path else INK, alpha=1 if on_path else 0.22, edgecolor="none"))
        ax.text(c + 0.5, y + 0.5, "Qu" if letter == "q" else letter.upper(), ha="center", va="center", fontsize=14 if size == 4 else 11, fontweight="bold", color=SURFACE if on_path else INK)
    if len(path) > 1:
        xs = [p % size + 0.5 for p in path]
        ys = [size - 1 - p // size + 0.5 for p in path]
        ax.plot(xs, ys, color=SURFACE, linewidth=2.2, alpha=0.9, solid_capstyle="round")
        ax.plot(xs[0], ys[0], "o", color=SURFACE, markersize=5)
    ax.set_title(title, fontsize=9, pad=3)
    ax.text(size / 2, -0.12, subtitle, ha="center", va="top", fontsize=7, color=MUTED)

def example_boards():
    seeds = list(examples.keys())
    variants = [("current", RED), ("fixed", ORANGE), ("spread", INK), ("current/refill", RED), ("spread/refill", INK)]
    fig, axes = plt.subplots(len(seeds), len(variants), figsize=(3.1 * len(variants), 3.3 * len(seeds)))
    for row, seed in enumerate(seeds):
        for col, (label, color) in enumerate(variants):
            ax = axes[row][col]
            b = examples[seed].get(label)
            if not b:
                ax.axis("off")
                continue
            m = b["m"]
            sub = f"{m['words']} words · {m['len6plus']} of 6+ · {m['vowels']} vow · {m['distinct']} distinct"
            if b["attempts"] > 1:
                sub += f" · try {b['attempts']}"
            draw_board(ax, b["letters"], m["size"], b["path"], f"{label}", sub, color)
        axes[row][0].text(-0.55, examples[seed]["current"]["m"]["size"] / 2, seed, rotation=90, ha="center", va="center", fontsize=11, color=INK, fontweight="bold")
    fig.suptitle("Same seed word, same rng: construction only (first three columns) and with selection (last two)", y=1.0)
    fig.tight_layout()
    save(fig, "C1_same_seed_examples.png")

def wordless():
    fig, axes = plt.subplots(1, 2, figsize=(13, 4.8))
    for ax, size in zip(axes, [4, 5]):
        groups = [
            ("current/single", RED, "current (today)"),
            ("current/refill", RED, "current + retry"),
            ("classic/single", MUTED, "classic dice (Mondays)"),
            ("classic/refill", MUTED, "classic dice + retry"),
            ("bag/single", GREEN, "bag (wordless)"),
            ("bag/refill", GREEN, "bag + retry"),
        ]
        data, names, colors = [], [], []
        for label, color, name in groups:
            rows = cell(size, label)
            if rows.empty:
                continue
            data.append(rows["words"].to_numpy())
            names.append(name)
            colors.append(color)
        parts = ax.violinplot(data, showmedians=True, widths=0.8)
        for body, color in zip(parts["bodies"], colors):
            body.set_facecolor(color)
            body.set_alpha(0.55)
        for key in ("cmedians", "cbars", "cmins", "cmaxes"):
            parts[key].set_color(INK)
            parts[key].set_linewidth(1)
        for i, d in enumerate(data):
            ax.text(i + 1, np.max(d), f"{int(np.median(d))}", ha="center", va="bottom", fontsize=8, color=colors[i])
        ax.axhline(floors[size]["words"], color=MUTED, linestyle="--", linewidth=1)
        ax.set_xticks(range(1, len(names) + 1))
        ax.set_xticklabels(names, fontsize=7.5, rotation=15, ha="right")
        ax.set_ylabel("findable words")
        ax.set_title(f"{size}×{size}", fontsize=10)
    fig.suptitle("Wordless generators: classic dice and the bag fill, with and without the retry loop", y=1.0)
    fig.tight_layout()
    save(fig, "D1_wordless.png")

def ladders():
    fig, axes = plt.subplots(1, 3, figsize=(16, 4.8))
    labels = ["current/redraw", "spread/redraw/curated", "current/redraw/ladder", "spread/redraw/ladder"]
    names = ["current\nredraw", "spread\ncurated", "current\nladder-weighted", "spread\nladder-weighted"]
    colors = [RED, INK, RED, INK]

    ax = axes[0]
    for size, hatch in [(4, None), (5, "//")]:
        vals = [cell(size, l)["goodLadder"].mean() * 100 for l in labels]
        x = np.arange(len(labels)) + (-0.2 if size == 4 else 0.2)
        ax.bar(x, vals, 0.4, color=colors, alpha=0.85 if size == 4 else 0.5, hatch=hatch, label=f"{size}×{size}")
        for xi, v in zip(x, vals):
            ax.text(xi, v + 0.5, f"{v:.0f}%", ha="center", fontsize=8)
    ax.set_xticks(range(len(labels)))
    ax.set_xticklabels(names, fontsize=8)
    ax.set_ylabel("% of boards with a good ladder")
    ax.set_title("How often is there a ladder?", fontsize=10)
    ax.legend(fontsize=8)

    ax = axes[1]
    bins = np.linspace(1, 6, 26)
    for l, color, name in [("current/redraw", RED, "current redraw"), ("spread/redraw/ladder", INK, "ladder-weighted")]:
        ax.hist(cell(4, l)["seedZipf"].dropna(), bins=bins, alpha=0.5, color=color, label=name)
    ax.axvline(3, color=MUTED, linestyle="--", linewidth=1)
    ax.text(2.95, ax.get_ylim()[1] * 0.95, "rare ←", ha="right", va="top", fontsize=8, color=MUTED)
    ax.set_xlabel("Zipf frequency of the seed word")
    ax.set_ylabel("boards (4×4)")
    ax.set_title("Does ladder weighting kill rare words?", fontsize=10)
    ax.legend(fontsize=8)

    ax = axes[2]
    d = days[days["dice"] == "word"].copy()
    ladder_days = json.loads((DATA / "ladder_days.json").read_text())
    d["minRung"] = d["seedWord"].map(lambda w: ladder_days[w]["minRungZipf"])
    ax.scatter(d["minRung"], d["foundSeed"] * 100, color=INK, s=40, alpha=0.8)
    for _, r in d.iterrows():
        if r["foundSeed"] > 0.04 or r["minRung"] >= 4:
            ax.annotate(r["seedWord"], (r["minRung"], r["foundSeed"] * 100), fontsize=6.5, xytext=(3, 2), textcoords="offset points")
    ax.set_xlabel("min Zipf of the rungs below the seed word (0 = no ladder)")
    ax.set_ylabel("% of players who found the seed")
    ax.set_title("Real days: climbable rungs → seed gets found (ρ = 0.41)".replace("ρ", "rho"), fontsize=10)
    fig.suptitle("Ladders", y=1.0)
    fig.tight_layout()
    save(fig, "D2_ladders.png")

if __name__ == "__main__":
    metric_validation()
    revealed_preference()
    seed_find_rate()
    factorial_grid()
    paired_deltas()
    floor_tail()
    secondary_metrics()
    example_boards()
    wordless()
    ladders()
