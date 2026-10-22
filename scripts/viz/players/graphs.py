import json
import sys
from collections import Counter
from pathlib import Path
from typing import cast

import geopandas as gpd
import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from matplotlib.colors import to_rgb
from matplotlib.offsetbox import AnnotationBbox, OffsetImage
from matplotlib.patches import Patch
from matplotlib.ticker import FuncFormatter, MultipleLocator

sys.path.insert(0, str(Path(__file__).parent.parent))
import style
from geocode import find_country_code, geocode
from style import DATA, GRAPHS, GREEN, INK, INK_CMAP, INK_LIGHT, MUTED, ORANGE, PAPER, RED, SURFACE

from english import ENGLISH_SPEAKING_PCT
from flags import circular_flag

style.apply()

WORLD_URL = "https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip"
WORLD_CACHE = DATA / "ne_50m_admin_0_countries.zip"
COUNTRY_NAME_ALIASES = {
    "United States of America": "United States",
    "Netherlands": "The Netherlands",
    "Turkey": "Türkiye",
    "Bosnia and Herz.": "Bosnia and Herzegovina",
}

NEVER_PLAYED = PAPER
BORDER = SURFACE
WIN_RATE_MAX = 60
MIN_GAMES = 5

snapshot = sys.argv[1] if len(sys.argv) > 1 else None
suffix = f"_{snapshot}" if snapshot else ""

def load() -> tuple[pd.DataFrame, pd.DataFrame]:
    players = pd.read_csv(DATA / f"players{suffix}.csv")
    avas = pd.read_csv(DATA / f"avas{suffix}.csv")
    return geocode(players), avas

def load_world() -> gpd.GeoDataFrame:
    if not WORLD_CACHE.exists():
        from urllib.request import urlretrieve

        urlretrieve(WORLD_URL, WORLD_CACHE)
    world = cast(gpd.GeoDataFrame, gpd.read_file(WORLD_CACHE))
    world["match_name"] = world["NAME"].replace(COUNTRY_NAME_ALIASES)
    return cast(gpd.GeoDataFrame, world[world["NAME"] != "Antarctica"])

def country_stats(games: pd.DataFrame) -> pd.DataFrame:
    with_country = games[games["country"] != ""]
    stats = with_country.groupby("country")["beatAva"].agg(["mean", "count"]).reset_index()
    stats = stats.rename(columns={"mean": "win_rate", "count": "games_played"})
    stats["win_rate"] *= 100
    return stats

def merge_world(world: gpd.GeoDataFrame, stats: pd.DataFrame) -> gpd.GeoDataFrame:
    merged = cast(gpd.GeoDataFrame, world.merge(stats, left_on="match_name", right_on="country", how="left"))
    unmatched = set(stats["country"]) - set(merged.loc[merged["country"].notna(), "country"])
    if unmatched:
        print(f"could not match {len(unmatched)} countries to the map: {sorted(unmatched)}")
    return merged

def map_axes(title: str):
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_axis_off()
    ax.set_title(title, fontsize=13)
    return fig, ax

def plot_played(merged: gpd.GeoDataFrame, out: Path, games: pd.DataFrame):
    played = merged["country"].notna()
    fig, ax = map_axes(f"Countries that have played  ({played.sum()} countries, {len(games):,} games)")
    merged[~played].plot(ax=ax, color=NEVER_PLAYED, edgecolor=BORDER, linewidth=0.4)
    merged[played].plot(ax=ax, color=INK, edgecolor=BORDER, linewidth=0.4)
    style.save(fig, out / "played.png")

def plot_win_rate(merged: gpd.GeoDataFrame, out: Path):
    played = merged["country"].notna() & (merged["games_played"] >= MIN_GAMES)
    few = merged["country"].notna() & ~played
    fig, ax = map_axes(f"Win rate by country  (countries with ≥ {MIN_GAMES} games)")
    merged[~merged["country"].notna()].plot(ax=ax, color=NEVER_PLAYED, edgecolor=BORDER, linewidth=0.4)
    merged[few].plot(ax=ax, color=INK_LIGHT, edgecolor=BORDER, linewidth=0.4, alpha=0.5)
    merged[played].plot(ax=ax, column="win_rate", cmap=INK_CMAP, vmin=0, vmax=WIN_RATE_MAX, edgecolor=BORDER, linewidth=0.4)
    sm = plt.cm.ScalarMappable(cmap=INK_CMAP, norm=plt.Normalize(0, WIN_RATE_MAX))
    cbar = fig.colorbar(sm, ax=ax, orientation="horizontal", fraction=0.03, pad=0.02, shrink=0.4)
    cbar.set_label("% of games where the player beat Ava", fontsize=9)
    cbar.outline.set_visible(False)
    style.save(fig, out / "winrate.png")

BIVARIATE_CORNERS = {
    (0, 0): to_rgb(PAPER),
    (1, 0): to_rgb(INK_LIGHT),
    (0, 1): to_rgb("#e8a090"),
    (1, 1): to_rgb(INK),
}
N_GAMES_BINS, N_WIN_BINS = 3, 4

def bivariate_color(t_games: float, t_win: float):
    c = BIVARIATE_CORNERS
    return tuple(
        c[(0, 0)][i] * (1 - t_games) * (1 - t_win)
        + c[(1, 0)][i] * t_games * (1 - t_win)
        + c[(0, 1)][i] * (1 - t_games) * t_win
        + c[(1, 1)][i] * t_games * t_win
        for i in range(3)
    )

BIVARIATE_GRID = [
    [bivariate_color(g / (N_GAMES_BINS - 1), w / (N_WIN_BINS - 1)) for w in range(N_WIN_BINS)]
    for g in range(N_GAMES_BINS)
]

def bin_by_rank(series: pd.Series, n_bins: int) -> pd.Series:
    return cast(pd.Series, pd.qcut(series.rank(method="first"), n_bins, labels=range(n_bins))).astype(int)

def plot_bivariate(merged: gpd.GeoDataFrame, out: Path):
    played = cast(gpd.GeoDataFrame, merged[merged["country"].notna() & (merged["games_played"] >= MIN_GAMES)]).copy()
    played["games_bin"] = bin_by_rank(cast(pd.Series, played["games_played"]), N_GAMES_BINS)
    played["win_bin"] = bin_by_rank(cast(pd.Series, played["win_rate"]), N_WIN_BINS)
    played["color"] = played.apply(lambda r: BIVARIATE_GRID[r["games_bin"]][r["win_bin"]], axis=1)

    fig, ax = map_axes("Games played vs win rate by country")
    merged[~merged.index.isin(played.index)].plot(ax=ax, color=NEVER_PLAYED, edgecolor=BORDER, linewidth=0.4)
    played.plot(ax=ax, color=played["color"], edgecolor=BORDER, linewidth=0.4)

    legend = fig.add_axes((0.12, 0.16, 0.14, 0.12))
    legend.imshow(BIVARIATE_GRID, origin="lower", extent=(0, N_WIN_BINS, 0, N_GAMES_BINS), aspect="auto")
    legend.set_xticks([])
    legend.set_yticks([])
    legend.set_xlabel("win rate →", fontsize=8)
    legend.set_ylabel("games played →", fontsize=8)
    for s in legend.spines.values():
        s.set_visible(False)
    style.save(fig, out / "games_vs_winrate.png")

def plot_cities(world: gpd.GeoDataFrame, games: pd.DataFrame, out: Path):
    located = games[(games["city"] != "") & games["lat"].notna()]
    stats = located.groupby(["city", "country", "lat", "lon"])["beatAva"].agg(["mean", "count"]).reset_index()
    stats = stats.rename(columns={"mean": "win_rate", "count": "games_played"}).sort_values("games_played")
    stats["win_rate"] *= 100

    fig, ax = map_axes(f"Where people play  ({len(stats):,} cities; size = games, colour = win rate)")
    world.plot(ax=ax, color=NEVER_PLAYED, edgecolor=BORDER, linewidth=0.4)
    ax.scatter(
        stats["lon"],
        stats["lat"],
        c=stats["win_rate"],
        cmap=INK_CMAP,
        vmin=0,
        vmax=WIN_RATE_MAX,
        s=np.sqrt(stats["games_played"]) * 6 + 4,
        edgecolor=SURFACE,
        linewidth=0.4,
        alpha=0.85,
    )
    style.save(fig, out / "cities.png")

def plot_english(games: pd.DataFrame, out: Path):
    english = pd.DataFrame(
        [{"iso2": find_country_code(n), "english_pct": p} for n, p in ENGLISH_SPEAKING_PCT.items()]
    ).dropna()
    stats = country_stats(games)
    stats["iso2"] = stats["country"].apply(find_country_code)
    merged = stats.merge(english, on="iso2", how="inner")
    merged = merged[merged["games_played"] >= MIN_GAMES].sort_values("games_played")

    fig, ax = plt.subplots(figsize=(15, 9))
    for _, row in merged.iterrows():
        try:
            img = mpimg.imread(circular_flag(row["iso2"]))
        except Exception as exc:
            print(f"no flag for {row['country']}: {exc}")
            continue
        zoom = 0.08 + min(row["games_played"], 300) / 300 * 0.1
        ax.add_artist(AnnotationBbox(OffsetImage(img, zoom=zoom), (row["english_pct"], row["win_rate"]), frameon=False, pad=0, zorder=row["games_played"]))

    r = merged["english_pct"].corr(merged["win_rate"])
    ax.set_xlim(-5, 105)
    ax.set_ylim(merged["win_rate"].min() - 5, merged["win_rate"].max() + 5)
    ax.set_xlabel("% of the country's population that speaks English")
    ax.set_ylabel("% of games where the player beat Ava")
    ax.set_title(f"Does speaking English help?  (r = {r:.2f}, {len(merged)} countries with ≥ {MIN_GAMES} games; size = games)")
    ax.grid(True, linestyle=":", alpha=0.4, color=MUTED)
    style.save(fig, out / "english_speakers_vs_winrate.png")

def hour_label(hour: float, _pos=None) -> str:
    minutes = round(hour * 60) % (24 * 60)
    h, m = divmod(minutes, 60)
    period = "am" if h < 12 else "pm"
    h12 = h % 12 or 12
    return f"{h12}{period}" if m == 0 else f"{h12}:{m:02d}{period}"

def plot_time_of_day(games: pd.DataFrame, out: Path):
    g = games[games["timezone"].notna()].copy()

    shared = g["createdAt"].value_counts()
    g = g[~g["createdAt"].isin(shared[shared > 1].index)]
    g["utc"] = pd.to_datetime(g["createdAt"], unit="ms", utc=True)

    def local_half_hour(group: pd.DataFrame) -> pd.Series:
        local = group["utc"].dt.tz_convert(group.name)
        return local.dt.hour + (local.dt.minute // 30) * 0.5

    g["slot"] = g.groupby("timezone", group_keys=False).apply(local_half_hour)
    by_slot = g.groupby("slot")["beatAva"]
    win = by_slot.mean().sort_index() * 100
    n = by_slot.size().sort_index()

    fig, ax = plt.subplots(figsize=(13, 5))
    ax.fill_between(n.index, 0, n / n.max() * win.max() * 0.9, color=INK, alpha=0.12, step=None, label="games played (scaled)")
    ax.plot(win.index, win, marker="o", markersize=4, color=INK, linewidth=1.8, label="% who beat Ava")
    ax.xaxis.set_major_formatter(FuncFormatter(hour_label))
    ax.xaxis.set_major_locator(MultipleLocator(2))
    ax.set_xlim(0, 23.5)
    ax.set_ylim(0, win.max() * 1.1)
    ax.set_xlabel("player's local time")
    ax.set_ylabel("% of games where the player beat Ava")
    ax.set_title(f"Win rate by time of day  ({len(g):,} games with a known timezone)")
    peak = win.idxmax()
    ax.annotate(f"peak {win.max():.0f}% at {hour_label(peak)}", (peak, win.max()), xytext=(8, 6), textcoords="offset points", fontsize=8, color=INK)
    ax.legend(fontsize=8, loc="lower right")
    style.save(fig, out / "time_of_day.png")

def plot_words(games: pd.DataFrame, avas: pd.DataFrame, out: Path):
    counts = Counter()
    for raw in games["words"]:
        counts.update(json.loads(raw))
    ava_counts = Counter()
    for raw in avas["words"]:
        ava_counts.update(json.loads(raw))

    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    for ax, c, label, color, denom in [
        (axes[0], counts, "players", INK, len(games)),
        (axes[1], ava_counts, "Ava", RED, len(avas)),
    ]:
        top = c.most_common(15)[::-1]
        words = [w for w, _ in top]
        vals = [n / denom * 100 for _, n in top]
        ax.barh(words, vals, color=color, alpha=0.85)
        for y, v in enumerate(vals):
            ax.text(v + 0.5, y, f"{v:.0f}%", va="center", fontsize=8)
        ax.set_xlabel(f"% of {label}' games containing the word")
        ax.set_title(f"{label}: most played words", fontsize=11)
    fig.suptitle("The words everyone plays", y=1.0)
    fig.tight_layout()
    style.save(fig, out / "common_words.png")

def plot_weekdays(games: pd.DataFrame, out: Path):
    order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    by_day = games.groupby("weekday").agg(win=("beatAva", "mean"), games=("beatAva", "size"), words=("wordCount", "median")).reindex(order)
    fig, ax = plt.subplots(figsize=(10, 4.5))
    x = np.arange(len(order))
    ax.bar(x, by_day["win"] * 100, color=[INK if d in ("Saturday", "Sunday") else ORANGE for d in order], alpha=0.85)
    for xi, (w, n, med) in enumerate(zip(by_day["win"], by_day["games"], by_day["words"])):
        ax.text(xi, w * 100 + 1, f"{w * 100:.0f}%", ha="center", fontsize=9)
        ax.text(xi, 1.5, f"{int(n) // 1000}k games\n{int(med)} words", ha="center", fontsize=7, color=SURFACE)
    ax.set_xticks(x)
    ax.set_xticklabels([d[:3] for d in order])
    ax.set_ylabel("% of games where the player beat Ava")
    ax.set_title("Win rate by weekday  (orange = 4×4, blue = 5×5; label = games, median words found)")
    style.save(fig, out / "weekdays.png")

def plot_over_time(games: pd.DataFrame, avas: pd.DataFrame, out: Path):
    daily = games.groupby("dateKey").agg(win=("beatAva", "mean"), games=("beatAva", "size"), score=("score", "median")).reset_index()
    daily = daily.merge(avas[["dateKey", "score"]].rename(columns={"score": "avaScore"}), on="dateKey", how="left")
    daily["date"] = pd.to_datetime(daily["dateKey"])

    fig, axes = plt.subplots(2, 1, figsize=(14, 7), sharex=True)
    axes[0].fill_between(daily["date"], 0, daily["games"], color=INK, alpha=0.25)
    axes[0].plot(daily["date"], daily["games"], color=INK, linewidth=1)
    axes[0].set_ylabel("games per day")
    axes[0].set_title(f"{len(games):,} games over {len(daily)} days")

    axes[1].plot(daily["date"], daily["score"], color=INK, linewidth=1.2, label="players' median score")
    axes[1].plot(daily["date"], daily["avaScore"], color=RED, linewidth=1.2, label="Ava's score")
    axes[1].fill_between(daily["date"], daily["win"] * 0, daily["win"] * daily["avaScore"].max() * 0.5, color=GREEN, alpha=0.12, label="% beat Ava (scaled)")
    axes[1].set_ylabel("points")
    axes[1].legend(fontsize=8, loc="upper left")
    fig.autofmt_xdate()
    style.save(fig, out / "over_time.png")

def summary(games: pd.DataFrame, avas: pd.DataFrame, out: Path):
    lines = [
        f"snapshot: {snapshot or 'latest'}",
        f"games: {len(games):,}  days: {games['dateKey'].nunique()}  first: {games['dateKey'].min()}  last: {games['dateKey'].max()}",
        f"countries: {games.loc[games['country'] != '', 'country'].nunique()}  cities: {games.loc[games['city'] != '', 'city'].nunique()}",
        f"beat ava: {games['beatAva'].mean() * 100:.1f}%  (under fair fight: {games['beatAvaFair'].mean() * 100:.1f}%)",
        f"median words per game: {games['wordCount'].median():.0f}  median score: {games['score'].median():.0f}  ava median: {avas['score'].median():.0f}",
    ]
    (out / "summary.txt").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))

def main():
    games, avas = load()
    out = GRAPHS / "players" / (snapshot or games["dateKey"].max())
    out.mkdir(parents=True, exist_ok=True)
    world = load_world()
    merged = merge_world(world, country_stats(games))

    summary(games, avas, out)
    plot_played(merged, out, games)
    plot_win_rate(merged, out)
    plot_bivariate(merged, out)
    plot_cities(world, games, out)
    plot_english(games, out)
    plot_time_of_day(games, out)
    plot_words(games, avas, out)
    plot_weekdays(games, out)
    plot_over_time(games, avas, out)

if __name__ == "__main__":
    main()
