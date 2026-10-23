import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Rectangle

sys.path.insert(0, str(Path(__file__).parent))
import style
from style import DATA, GREEN, INK, INK_CMAP, MUTED, ORANGE, RED, SURFACE

style.apply()
OUT = style.GRAPHS / "looks"
OUT.mkdir(parents=True, exist_ok=True)

ALPHABET = "abcdefghijklmnopqrstuvwxyz"
VOWELS = set("aeiou")
ORDER = ["word (before)", "word (now)", "classic (before)", "classic (now)", "spread", "bag"]
COLOURS = {"word (before)": RED, "word (now)": INK, "classic (before)": ORANGE, "classic (now)": "#b5651d", "spread": GREEN, "bag": MUTED}

boards = pd.read_csv(DATA / "looks.csv")


def adjacency(size: int):
    pairs = []
    for i in range(size * size):
        r, c = divmod(i, size)
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                rr, cc = r + dr, c + dc
                j = rr * size + cc
                if (dr or dc) and 0 <= rr < size and 0 <= cc < size and j > i:
                    pairs.append((i, j))
    return pairs


PAIRS = {n: adjacency(n) for n in (4, 5)}


def features(letters: str, size: int) -> dict:
    n = len(letters)
    is_v = [ch in VOWELS for ch in letters]
    v = sum(is_v)
    pairs = PAIRS[size]
    mixed = sum(is_v[i] != is_v[j] for i, j in pairs) / len(pairs)
    expected = 2 * v * (n - v) / (n * (n - 1)) if n > 1 else 0
    doubles = [letters[i] for i, j in pairs if letters[i] == letters[j]]
    return {
        "vowels": v,
        "distinct": len(set(letters)),
        "mixedExcess": mixed - expected,
        "doubles": len(doubles),
        "doubleLetters": "".join(doubles),
        "rare": sum(ch in "jqxz" for ch in letters),
        "maxRepeat": max(letters.count(ch) for ch in set(letters)),
    }


feats = pd.DataFrame([features(l, s) for l, s in zip(boards["letters"], boards["size"])])
boards = pd.concat([boards, feats], axis=1)


def gens(size: int):
    present = set(boards.loc[boards["size"] == size, "generator"])
    return [g for g in ORDER if g in present]


def save(fig, name):
    style.save(fig, OUT / name)


def heatmap(ax, matrix, rows, cols, cmap, norm=None, fmt="{:.0f}", vmin=None, vmax=None, text_threshold=None):
    im = ax.imshow(matrix, cmap=cmap, norm=norm, vmin=vmin, vmax=vmax, aspect="auto")
    ax.set_xticks(range(len(cols)))
    ax.set_xticklabels(cols, fontsize=8)
    ax.set_yticks(range(len(rows)))
    ax.set_yticklabels(rows, fontsize=9)
    ax.tick_params(length=0)
    for s in ax.spines.values():
        s.set_visible(False)
    for r in range(matrix.shape[0]):
        for c in range(matrix.shape[1]):
            val = matrix[r, c]
            if np.isnan(val):
                continue
            red, green, blue, _ = im.cmap(im.norm(val))
            light = 0.299 * red + 0.587 * green + 0.114 * blue < 0.55
            ax.text(c, r, fmt.format(val), ha="center", va="center", fontsize=6.5, color=SURFACE if light else INK)
    return im


ENGLISH_TEXT = {
    "a": 8.2, "b": 1.5, "c": 2.8, "d": 4.3, "e": 12.7, "f": 2.2, "g": 2.0, "h": 6.1, "i": 7.0, "j": 0.15,
    "k": 0.77, "l": 4.0, "m": 2.4, "n": 6.7, "o": 7.5, "p": 1.9, "q": 0.095, "r": 6.0, "s": 6.3, "t": 9.1,
    "u": 2.8, "v": 0.98, "w": 2.4, "x": 0.15, "y": 2.0, "z": 0.074,
}


def dictionary_frequency():
    words = (style.ROOT / "static" / "wordList.txt").read_text().split()
    counts = {ch: 0 for ch in ALPHABET}
    for w in words:
        for ch in w:
            if ch in counts:
                counts[ch] += 1
    total = sum(counts.values())
    return [counts[ch] / total * 100 for ch in ALPHABET]


def letter_frequency():
    rows = gens(4)
    sub = boards[boards["size"] == 4]
    share = [[np.mean([l.count(ch) for l in sub[sub["generator"] == g]["letters"]]) / 16 * 100 for ch in ALPHABET] for g in rows]
    share.append([ENGLISH_TEXT[ch] for ch in ALPHABET])
    share.append(dictionary_frequency())
    labels = rows + ["English text", "the word list"]
    fig, ax = plt.subplots(figsize=(16, 4.6))
    heatmap(ax, np.array(share), labels, list(ALPHABET.upper()), INK_CMAP, fmt="{:.1f}")
    ax.axhline(len(rows) - 0.5, color=SURFACE, linewidth=4)
    for label in ax.get_yticklabels()[len(rows):]:
        label.set_fontstyle("italic")
    ax.set_title("Share of tiles that are each letter (4×4, %), against English text (Lewand) and the letters of every word in the word list", fontsize=11)
    save(fig, "L1_letter_frequency.png")


def positional():
    rows = gens(4)
    sub = boards[boards["size"] == 4]
    measures = [
        ("vowel", lambda ch: ch in VOWELS),
        ("E", lambda ch: ch == "e"),
        ("S", lambda ch: ch == "s"),
        ("J Q X Z", lambda ch: ch in "jqxz"),
    ]
    fig, axes = plt.subplots(len(rows), len(measures), figsize=(9, 2.3 * len(rows)))
    for r, g in enumerate(rows):
        letters = sub[sub["generator"] == g]["letters"].to_numpy()
        for c, (name, test) in enumerate(measures):
            grid = np.array([[np.mean([test(l[y * 4 + x]) for l in letters]) for x in range(4)] for y in range(4)]) * 100
            ax = axes[r][c]
            vmin, vmax = {"vowel": (28, 50), "E": (8, 18), "S": (3, 11), "J Q X Z": (0, 5)}[name]
            im = ax.imshow(grid, cmap=INK_CMAP, vmin=vmin, vmax=vmax)
            for y in range(4):
                for x in range(4):
                    red, green, blue, _ = im.cmap(im.norm(grid[y, x]))
                    light = 0.299 * red + 0.587 * green + 0.114 * blue < 0.55
                    ax.text(x, y, f"{grid[y, x]:.0f}", ha="center", va="center", fontsize=7, color=SURFACE if light else INK)
            ax.set_xticks([])
            ax.set_yticks([])
            for s in ax.spines.values():
                s.set_visible(False)
            if r == 0:
                ax.set_title(f"P({name}) %", fontsize=10)
            if c == 0:
                ax.set_ylabel(g, fontsize=9, rotation=0, ha="right", va="center")
    fig.suptitle("Where on the grid letters land (4×4)", y=1.0)
    fig.tight_layout()
    save(fig, "L2_position.png")


def distribution_heatmaps():
    fig, axes = plt.subplots(1, 3, figsize=(17, 4.2), gridspec_kw={"width_ratios": [1, 1.4, 1]})
    rows = gens(4)
    sub = boards[boards["size"] == 4]

    counts = list(range(2, 12))
    m = np.array([[np.mean(sub[sub["generator"] == g]["vowels"] == v) * 100 for v in counts] for g in rows])
    heatmap(axes[0], m, rows, [str(v) for v in counts], INK_CMAP)
    axes[0].set_title("vowels on the board (% of boards)", fontsize=10)

    edges = np.arange(-0.25, 0.30, 0.05)
    labels = [f"{(a + b) / 2:+.2f}" for a, b in zip(edges[:-1], edges[1:])]
    m = np.array([np.histogram(sub[sub["generator"] == g]["mixedExcess"], bins=edges)[0] / (sub["generator"] == g).sum() * 100 for g in rows])
    heatmap(axes[1], m, rows, labels, INK_CMAP)
    axes[1].set_title("vowel layout: ← clumped   ·   interleaved →  (% of boards)", fontsize=10)

    dist = list(range(7, 16))
    m = np.array([[np.mean(sub[sub["generator"] == g]["distinct"] == d) * 100 for d in dist] for g in rows])
    heatmap(axes[2], m, rows, [str(d) for d in dist], INK_CMAP)
    axes[2].set_title("distinct letters (% of boards)", fontsize=10)

    for ax in axes[1:]:
        ax.set_yticklabels([])
    fig.suptitle("Shape of a board at a glance (4×4)", y=1.03)
    fig.tight_layout()
    save(fig, "L3_shape.png")


def doubles():
    rows = gens(4)
    sub = boards[boards["size"] == 4]
    per = {g: "".join(sub[sub["generator"] == g]["doubleLetters"]) for g in rows}
    letters = [ch for ch in ALPHABET if any(ch in s for s in per.values())]
    n = {g: (sub["generator"] == g).sum() for g in rows}
    m = np.array([[per[g].count(ch) / n[g] * 100 for ch in letters] for g in rows])
    fig, ax = plt.subplots(figsize=(14, 3.6))
    heatmap(ax, m, rows, [ch.upper() * 2 for ch in letters], INK_CMAP)
    totals = [m[i].sum() for i in range(len(rows))]
    ax.set_yticklabels([f"{g}  ({t:.0f})" for g, t in zip(rows, totals)], fontsize=9)
    ax.set_title("Identical letters next to each other: pairs per 100 boards (4×4; total in brackets)", fontsize=11)
    save(fig, "L4_adjacent_doubles.png")


def projection():
    fig, axes = plt.subplots(1, 2, figsize=(15, 6.5))
    for ax, size in zip(axes, (4, 5)):
        sub = boards[boards["size"] == size].reset_index(drop=True)
        counts = np.array([[l.count(ch) for ch in ALPHABET] for l in sub["letters"]], dtype=float)
        extra = sub[["vowels", "distinct", "mixedExcess", "doubles", "rare", "maxRepeat"]].to_numpy(dtype=float)
        X = np.hstack([counts, extra])
        X = (X - X.mean(0)) / (X.std(0) + 1e-9)
        _, s, vt = np.linalg.svd(X, full_matrices=False)
        P = X @ vt[:2].T
        explained = s[:2] ** 2 / (s**2).sum() * 100
        rng = np.random.default_rng(0)
        for g in gens(size):
            idx = np.where(sub["generator"] == g)[0]
            idx = rng.choice(idx, size=min(350, len(idx)), replace=False)
            ax.scatter(P[idx, 0], P[idx, 1], s=8, alpha=0.45, color=COLOURS[g], label=g, edgecolor="none")
            cx, cy = P[sub["generator"] == g].mean(0)
            ax.scatter([cx], [cy], s=160, color=COLOURS[g], edgecolor=SURFACE, linewidth=2, zorder=5)
        top = np.argsort(-np.abs(vt[0]))[:4]
        names = list(ALPHABET.upper()) + ["vowels", "distinct", "vowel layout", "doubles", "J/Q/X/Z", "max repeat"]
        ax.set_xlabel(f"PC1 ({explained[0]:.0f}%): " + ", ".join(names[i] for i in top), fontsize=8)
        ax.set_ylabel(f"PC2 ({explained[1]:.0f}%)", fontsize=8)
        ax.set_title(f"{size}×{size}", fontsize=10)
        ax.legend(fontsize=8, markerscale=2.5)
    fig.suptitle("Every board as a point: letters and layout squashed to two dimensions (big dots = average board)", y=1.0)
    fig.tight_layout()
    save(fig, "L5_projection.png")


def montage():
    rows = gens(4)
    sub = boards[boards["size"] == 4]
    k = 8
    fig, axes = plt.subplots(len(rows), k, figsize=(k * 1.6, len(rows) * 1.75))
    for r, g in enumerate(rows):
        sample = sub[sub["generator"] == g].sample(k, random_state=3)["letters"].to_numpy()
        for c, letters in enumerate(sample):
            ax = axes[r][c]
            ax.set_xlim(0, 4)
            ax.set_ylim(0, 4)
            ax.set_aspect("equal")
            ax.axis("off")
            for i, ch in enumerate(letters):
                y, x = divmod(i, 4)
                ax.add_patch(Rectangle((x, 3 - y), 1, 1, facecolor=INK, edgecolor=SURFACE, linewidth=0.8))
                ax.text(x + 0.5, 3 - y + 0.28, "Qu" if ch == "q" else ch.upper(), ha="center", va="baseline", fontsize=9, color=SURFACE, family="Sono")
            if c == 0:
                ax.text(-0.3, 2, g, ha="right", va="center", fontsize=9)
    fig.suptitle("Eight random boards from each generator", y=1.0)
    fig.tight_layout()
    save(fig, "L0_montage.png")


def summary():
    rows = []
    for size in (4, 5):
        for g in gens(size):
            s = boards[(boards["size"] == size) & (boards["generator"] == g)]
            rows.append(
                {
                    "size": f"{size}×{size}",
                    "generator": g,
                    "vowels": f"{s['vowels'].mean():.1f} ± {s['vowels'].std():.1f}",
                    "distinct": round(s["distinct"].mean(), 1),
                    "vowel layout": round(s["mixedExcess"].mean(), 3),
                    "doubles": round(s["doubles"].mean(), 2),
                    "J/Q/X/Z": round(s["rare"].mean(), 2),
                    "max repeat": round(s["maxRepeat"].mean(), 2),
                }
            )
    print(pd.DataFrame(rows).to_string(index=False))


summary()
montage()
letter_frequency()
positional()
distribution_heatmaps()
doubles()
projection()
