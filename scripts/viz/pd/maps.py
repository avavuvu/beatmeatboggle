from pathlib import Path
from typing import cast

import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.colors import LinearSegmentedColormap, to_rgb
from matplotlib.figure import Figure

from data_explore import beat_ava
from main import find_latest, load_avas_words

DATA_DIR = Path(__file__).parent.parent / "data"
MAP_DIR = Path(__file__).parent / "maps"

WORLD_URL = "https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.zip"

COUNTRY_NAME_ALIASES = {
    "United States of America": "United States",
    "Netherlands": "The Netherlands",
    "Turkey": "Türkiye",
    "Bosnia and Herz.": "Bosnia and Herzegovina",
}

NEVER_PLAYED = "white"
COUNTRY_BORDER = "#cccccc"
GREEN = "#2e7d32"
LIGHT_GREEN = "#c8e6c9"
WHITE_GREEN_CMAP = LinearSegmentedColormap.from_list("light_green_to_green", [LIGHT_GREEN, GREEN])
WIN_RATE_MAX = 40

N_GAMES_BINS = 3
N_WIN_BINS = 5

# corners of the bivariate grid: (games low/high, win low/high)
BIVARIATE_CORNERS = {
    (0, 0): to_rgb("#e8e8e8"),  # low games, low win
    (1, 0): to_rgb("#64acbe"),  # high games, low win
    (0, 1): to_rgb("#c85a5a"),  # low games, high win
    (1, 1): to_rgb("#574249"),  # high games, high win
}


def bivariate_color(t_games: float, t_win: float) -> tuple[float, float, float]:
    c00 = BIVARIATE_CORNERS[(0, 0)]
    c10 = BIVARIATE_CORNERS[(1, 0)]
    c01 = BIVARIATE_CORNERS[(0, 1)]
    c11 = BIVARIATE_CORNERS[(1, 1)]

    return cast(
        tuple[float, float, float],
        tuple(
            c00[i] * (1 - t_games) * (1 - t_win)
            + c10[i] * t_games * (1 - t_win)
            + c01[i] * (1 - t_games) * t_win
            + c11[i] * t_games * t_win
            for i in range(3)
        ),
    )


def build_bivariate_grid(n_games_bins: int, n_win_bins: int) -> list[list[tuple[float, float, float]]]:
    return [
        [
            bivariate_color(
                games_bin / (n_games_bins - 1) if n_games_bins > 1 else 0,
                win_bin / (n_win_bins - 1) if n_win_bins > 1 else 0,
            )
            for win_bin in range(n_win_bins)
        ]
        for games_bin in range(n_games_bins)
    ]


BIVARIATE_GRID = build_bivariate_grid(N_GAMES_BINS, N_WIN_BINS)


def load_world() -> gpd.GeoDataFrame:
    world = cast(gpd.GeoDataFrame, gpd.read_file(WORLD_URL))
    world["match_name"] = world["NAME"].replace(COUNTRY_NAME_ALIASES)
    return world


def load_games(avas_games: dict[str, set[str]]) -> pd.DataFrame:
    players = pd.read_csv(DATA_DIR / "players_geocoded.csv")
    games = players.copy()
    games["beat_ava"] = games.apply(lambda row: beat_ava(row, avas_games, False), axis=1)
    return games


def country_stats(games: pd.DataFrame) -> pd.DataFrame:
    with_country = cast(pd.DataFrame, games.dropna(subset=["country"]))
    grouped = with_country.groupby("country")["beat_ava"]
    stats = cast(pd.DataFrame, grouped.agg(["mean", "count"]).reset_index())
    stats = stats.rename(columns={"mean": "win_rate", "count": "games_played"})
    stats["win_rate"] *= 100
    return stats


def merge_world_stats(world: gpd.GeoDataFrame, stats: pd.DataFrame) -> gpd.GeoDataFrame:
    merged = cast(gpd.GeoDataFrame, world.merge(stats, left_on="match_name", right_on="country", how="left"))

    matched = set(merged.loc[merged["country"].notna(), "country"])
    unmatched = set(stats["country"]) - matched
    if unmatched:
        print(f"Could not match {len(unmatched)} countries to the world map: {sorted(unmatched)}")

    return merged


def plot_played_vs_never(merged: gpd.GeoDataFrame):
    played = merged["country"].notna()

    _fig, ax = plt.subplots()
    merged[~played].plot(ax=ax, color=NEVER_PLAYED, edgecolor=COUNTRY_BORDER, linewidth=0.3)
    merged[played].plot(ax=ax, color=GREEN, edgecolor=COUNTRY_BORDER, linewidth=0.3)
    ax.set_title("Countries that have played BM@B")
    ax.set_axis_off()
    plt.savefig(MAP_DIR / "played.png")


def plot_country_win_rate(merged: gpd.GeoDataFrame):
    played = merged["country"].notna()

    _fig, ax = plt.subplots()
    merged[~played].plot(ax=ax, color=NEVER_PLAYED, edgecolor=COUNTRY_BORDER, linewidth=0.3)
    merged[played].plot(
        ax=ax,
        column="win_rate",
        cmap=WHITE_GREEN_CMAP,
        vmin=0,
        vmax=WIN_RATE_MAX,
        edgecolor=COUNTRY_BORDER,
        linewidth=0.3,
        legend=False,
        legend_kwds={"label": "% of games player beat Ava", "orientation": "horizontal"},
    )

    ax.set_title("Win rate by country")
    ax.set_axis_off()
    plt.savefig(MAP_DIR / "winrate.png")


def bin_by_rank(series: pd.Series, n_bins: int = 3) -> pd.Series:
    ranks = series.rank(method="first")
    return cast(pd.Series, pd.qcut(ranks, n_bins, labels=range(n_bins))).astype(int)


def add_bivariate_legend(fig: Figure):
    legend_ax = fig.add_axes((0.08, 0.12, 0.2, 0.16))

    legend_ax.imshow(BIVARIATE_GRID, origin="lower", extent=(0, N_WIN_BINS, 0, N_GAMES_BINS), aspect="auto")

    legend_ax.set_xticks([])
    legend_ax.set_yticks([])
    legend_ax.set_xlabel("% beat Ava \u2192", fontsize=8)
    legend_ax.set_ylabel("Games played \u2192", fontsize=8)


def plot_bivariate_choropleth(merged: gpd.GeoDataFrame):
    played = cast(gpd.GeoDataFrame, merged[merged["country"].notna()]).copy()

    played["games_bin"] = bin_by_rank(cast(pd.Series, played["games_played"]), N_GAMES_BINS)
    played["winrate_bin"] = bin_by_rank(cast(pd.Series, played["win_rate"]), N_WIN_BINS)
    played["bivariate_color"] = played.apply(
        lambda row: BIVARIATE_GRID[row["games_bin"]][row["winrate_bin"]], axis=1
    )

    never_played = merged[merged["country"].isna()]

    fig, ax = plt.subplots()
    never_played.plot(ax=ax, color=NEVER_PLAYED, edgecolor=COUNTRY_BORDER, linewidth=0.3)
    played.plot(ax=ax, color=played["bivariate_color"], edgecolor=COUNTRY_BORDER, linewidth=0.3)

    ax.set_title("Games played vs. win rate by country")
    ax.set_axis_off()

    add_bivariate_legend(fig)

    plt.savefig(MAP_DIR / "games_vs_played.png")


def plot_city_scatter(world: gpd.GeoDataFrame, games: pd.DataFrame):
    with_location = cast(pd.DataFrame, games.dropna(subset=["lat", "lon", "city"]))
    grouped = with_location.groupby(["city", "country", "lat", "lon"])["beat_ava"]
    stats = cast(pd.DataFrame, grouped.agg(["mean", "count"]).reset_index())
    stats = stats.rename(columns={"mean": "win_rate", "count": "games_played"})
    stats["win_rate"] *= 100

    _fig, ax = plt.subplots()
    world.plot(ax=ax, color="#e8e8e8", edgecolor=COUNTRY_BORDER, linewidth=0.3)

    ax.scatter(
        stats["lon"],
        stats["lat"],
        c=stats["win_rate"],
        cmap=WHITE_GREEN_CMAP,
        vmin=0,
        vmax=WIN_RATE_MAX,
        s=stats["games_played"].clip(upper=50) * 2 + 10,
        edgecolor="black",
        linewidth=0.3,
    )
    ax.set_title("Win rate by city")
    ax.set_axis_off()
    plt.savefig(MAP_DIR / "cities.png")


def main():
    avas_games = load_avas_words(find_latest("avas_????-??-??.csv"))
    games = load_games(avas_games)

    world = load_world()
    stats = country_stats(games)
    merged = merge_world_stats(world, stats)

    plot_played_vs_never(merged)
    plot_country_win_rate(merged)
    plot_bivariate_choropleth(merged)
    plot_city_scatter(world, games)


if __name__ == "__main__":
    main()
