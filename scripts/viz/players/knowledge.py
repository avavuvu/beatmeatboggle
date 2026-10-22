import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))
import style
from style import DATA, GREEN, INK, MUTED, ORANGE, RED

style.apply()
OUT = style.GRAPHS / "behaviour"
SPLIT = "2026-09-11"

words = pd.read_csv(DATA / "word_features.csv")
days = pd.read_csv(DATA / "play_days.csv").set_index("date")

def design(df: pd.DataFrame) -> tuple[np.ndarray, list[str]]:
    z = df["zipf"].clip(0, 7)
    cols = {
        "intercept": np.ones(len(df)),
        "zipf": z,
        "zipf²": z**2,
        "len4": (df["length"] == 4).astype(float),
        "len5": (df["length"] == 5).astype(float),
        "len6": (df["length"] == 6).astype(float),
        "len7": (df["length"] == 7).astype(float),
        "len8+": (df["length"] >= 8).astype(float),
        "plural": df["plural"].astype(float),
        "hasShorter": df["hasShorter"].astype(float),
        "hasLonger": df["hasLonger"].astype(float),
        "logPaths": np.log(df["pathCount"]),
        "minTurns": df["minTurns"],
        "startsOnEdge": df["startsOnEdge"].astype(float),
        "size5": (df["size"] == 5).astype(float),
    }
    return np.column_stack(list(cols.values())), list(cols)

def fit_logistic(X: np.ndarray, y: np.ndarray, w: np.ndarray, iterations: int = 30, ridge: float = 1e-4) -> np.ndarray:
    beta = np.zeros(X.shape[1])
    for _ in range(iterations):
        eta = X @ beta
        mu = 1 / (1 + np.exp(-eta))
        v = np.clip(mu * (1 - mu), 1e-6, None)
        W = w * v
        z = eta + (y - mu) / v
        beta = np.linalg.solve(X.T @ (W[:, None] * X) + ridge * np.eye(X.shape[1]), X.T @ (W * z))
    return beta

def predict(df: pd.DataFrame, beta: np.ndarray) -> np.ndarray:
    X, _ = design(df)
    return 1 / (1 + np.exp(-(X @ beta)))

train = words[words["date"] < SPLIT]
test = words[words["date"] >= SPLIT]
X, names = design(train)
beta = fit_logistic(X, train["rate"].to_numpy(), train["players"].to_numpy())

words["predicted"] = predict(words, beta)
train = words[words["date"] < SPLIT]
test = words[words["date"] >= SPLIT]

def weighted_r2(df: pd.DataFrame) -> float:
    w = df["players"]
    resid = ((df["rate"] - df["predicted"]) ** 2 * w).sum()
    total = ((df["rate"] - np.average(df["rate"], weights=w)) ** 2 * w).sum()
    return 1 - resid / total

print(f"train: {len(train):,} (day, word) rows on {train['date'].nunique()} days   test: {len(test):,} rows on {test['date'].nunique()} days")
print(f"weighted R² of find rate: train {weighted_r2(train):.3f}  test {weighted_r2(test):.3f}")
print("\ncoefficients (log-odds):")
for n, b in zip(names, beta):
    print(f"  {n:14s} {b:+.3f}")

(DATA / "knowledge_model.json").write_text(json.dumps({"split": SPLIT, "coefficients": dict(zip(names, map(float, beta)))}, indent=2))

def board_scores(df: pd.DataFrame) -> pd.DataFrame:
    g = df.groupby("date")
    out = pd.DataFrame(
        {
            "expectedWords": g["predicted"].sum(),
            "expectedScore": g.apply(lambda d: (d["predicted"] * d["points"]).sum(), include_groups=False),
            "expected6plus": g.apply(lambda d: d.loc[d["length"] >= 6, "predicted"].sum(), include_groups=False),
            "totalWords": g.size(),
            "maxScore": g["points"].sum(),
            "size": g["size"].first(),
        }
    )
    out = out.join(days[["medianScore", "medianWords", "has6", "dice"]])
    return out

board = board_scores(words)
board["era"] = np.where(board.index >= SPLIT, "test", "train")

def corr_table(sub: pd.DataFrame, label: str):
    rows = []
    for col in ["totalWords", "maxScore", "expectedWords", "expectedScore"]:
        rows.append(
            {
                "predictor": col,
                "spearman vs median score": round(sub[col].corr(sub["medianScore"], method="spearman"), 3),
                "pearson vs median score": round(sub[col].corr(sub["medianScore"]), 3),
                "spearman vs median words": round(sub[col].corr(sub["medianWords"], method="spearman"), 3),
            }
        )
    print(f"\n{label} (n = {len(sub)} days)")
    print(pd.DataFrame(rows).to_string(index=False))

for size in [4, 5]:
    corr_table(board[(board["era"] == "test") & (board["size"] == size)], f"out-of-sample {size}×{size} word-generator days")
corr_table(board[board["era"] == "test"], "out-of-sample, both sizes")
corr_table(board[board["era"] == "train"], "in-sample (before the word generator)")

def plot_find_rate_curves():
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    bands = [(3, "3 letters", MUTED), (4, "4", ORANGE), (5, "5", GREEN), (6, "6", INK), (7, "7+", RED)]
    sub = words[words["size"] == 4]
    for ax, (title, col) in zip(axes, [("observed", "rate"), ("model", "predicted")]):
        for length, label, color in bands:
            s = sub[sub["length"] == length] if length < 7 else sub[sub["length"] >= 7]
            bins = np.arange(0, 7.5, 0.5)
            s = s.assign(bin=pd.cut(s["zipf"].clip(0, 6.99), bins, labels=bins[:-1] + 0.25))
            g = s.groupby("bin", observed=True).apply(lambda d: np.average(d[col], weights=d["players"]) if len(d) >= 5 else np.nan, include_groups=False)
            ax.plot(g.index.astype(float), g.to_numpy() * 100, marker="o", markersize=3, color=color, label=label, linewidth=1.6)
        ax.set_xlabel("word frequency (zipf)")
        ax.set_ylabel("% of players who find the word")
        ax.set_title(f"{title}, 4×4 boards", fontsize=11)
        ax.set_ylim(0, 100)
        ax.legend(title="length", fontsize=8)
    fig.suptitle("What do players know?  find rate by how common a word is and how long it is", y=1.0)
    fig.tight_layout()
    style.save(fig, OUT / "K1_find_rate_by_zipf_and_length.png")

def plot_expected_vs_actual():
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))
    for ax, col, label in [(axes[0], "totalWords", "findable words on the board"), (axes[1], "expectedScore", "model: expected score per player")]:
        for era, color, marker in [("train", MUTED, "o"), ("test", INK, "o")]:
            s = board[board["era"] == era]
            for size, alpha in [(4, 0.9), (5, 0.5)]:
                ss = s[s["size"] == size]
                ax.scatter(ss[col], ss["medianScore"], color=color, alpha=alpha, s=28 if size == 4 else 46, marker=marker, edgecolor=style.SURFACE, linewidth=0.5, label=f"{era} {size}×{size}")
        t = board[board["era"] == "test"]
        rho = t[col].corr(t["medianScore"], method="spearman")
        ax.set_xlabel(label)
        ax.set_ylabel("actual median player score")
        ax.set_title(f"spearman on out-of-sample days: {rho:.2f}", fontsize=10)
        ax.legend(fontsize=7, loc="upper left")
    fig.suptitle("Predicting how a board will play: raw word count vs the knowledge model", y=1.0)
    fig.tight_layout()
    style.save(fig, OUT / "K2_expected_vs_actual.png")

def plot_coefficients():
    fig, ax = plt.subplots(figsize=(8, 5))
    order = [n for n in names if n != "intercept"]
    vals = [beta[names.index(n)] for n in order]
    colors = [GREEN if v > 0 else RED for v in vals]
    ax.barh(order, vals, color=colors, alpha=0.85)
    ax.axvline(0, color=INK, linewidth=0.8)
    ax.set_xlabel("effect on log-odds of being found (zipf is per unit; lengths vs 3 letters)")
    ax.set_title("What makes a word get found")
    ax.invert_yaxis()
    style.save(fig, OUT / "K3_coefficients.png")

def plot_invisible_words():
    t = words[words["players"] >= 500]
    never = t[t["rate"] < 0.002]
    fig, axes = plt.subplots(1, 2, figsize=(13, 4.5))
    bins = np.arange(0, 7.5, 0.5)
    axes[0].hist(t["zipf"].clip(0, 6.99), bins=bins, color=INK, alpha=0.35, label="all findable words")
    axes[0].hist(never["zipf"].clip(0, 6.99), bins=bins, color=RED, alpha=0.7, label=f"found by < 0.2% of players ({len(never):,})")
    axes[0].set_xlabel("zipf")
    axes[0].set_ylabel("(day, word) rows")
    axes[0].set_title("Words nobody finds are mostly words nobody knows", fontsize=10)
    axes[0].legend(fontsize=8)
    by_len = t.groupby("length").apply(lambda d: (d["rate"] < 0.002).mean(), include_groups=False) * 100
    by_len = by_len[by_len.index <= 10]
    axes[1].bar(by_len.index, by_len.to_numpy(), color=INK, alpha=0.85)
    axes[1].set_xlabel("word length")
    axes[1].set_ylabel("% of findable words found by < 0.2%")
    axes[1].set_title("…and long words are invisible by default", fontsize=10)
    fig.tight_layout()
    style.save(fig, OUT / "K4_invisible_words.png")
    sample = never.sort_values("zipf", ascending=False).drop_duplicates("word").head(25)
    print("\nhighest-frequency words that < 0.2% of players found:", ", ".join(f"{w} ({z:.1f}, {l})" for w, z, l in zip(sample["word"], sample["zipf"], sample["length"])))

plot_find_rate_curves()
plot_expected_vs_actual()
plot_coefficients()
plot_invisible_words()
