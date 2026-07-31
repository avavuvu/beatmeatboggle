"""
Scatterplot: % of a country's population that speaks English (native +
additional-language speakers) vs. the % of games in which a player from
that country beat Ava at Boggle.

Source: https://en.wikipedia.org/wiki/List_of_countries_by_English-speaking_population
("Total %" column, i.e. native + additional-language speakers combined).
Unlike the EF EPI, this includes native English-speaking countries like the
US, UK, Australia, Canada, Ireland, and New Zealand.

Flag icons come from https://flagcdn.com and are cached under
scripts/viz/pd/flags/.
"""

from pathlib import Path
from urllib.request import urlretrieve

import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.offsetbox import AnnotationBbox, OffsetImage
from PIL import Image, ImageDraw

from geocode import find_country_code
from main import find_latest, load_avas_words
from maps import country_stats, load_games

MAP_DIR = Path(__file__).parent / "maps"
FLAG_DIR = Path(__file__).parent / "flags"
CIRCLE_FLAG_DIR = Path(__file__).parent / "flags_circular"
CIRCLE_SIZE = 200  # px, resolution of the cropped/masked circular flag

# Countries with very few recorded games are too noisy to plot meaningfully.
MIN_GAMES = 5

# % of population that speaks English (native + additional language),
# "Total %" column from the Wikipedia list linked above.
ENGLISH_SPEAKING_PCT = {
    "United States": 95.88,
    "India": 19.00,
    "Nigeria": 60.64,
    "Pakistan": 48.91,
    "Indonesia": 30.80,
    "Philippines": 63.74,
    "United Kingdom": 98.28,
    "Germany": 55.74,
    "Kenya": 78.68,
    "Egypt": 35.00,
    "Japan": 28.00,
    "South Africa": 50.70,
    "Canada": 82.07,
    "Australia": 91.10,
    "Uganda": 44.73,
    "Spain": 39.00,
    "Poland": 49.95,
    "Ghana": 67.19,
    "Thailand": 27.16,
    "Ukraine": 51.00,
    "Italy": 28.20,
    "France": 24.60,
    "Mexico": 13.00,
    "Malaysia": 57.34,
    "Netherlands": 90.94,
    "Turkey": 14.96,
    "Brazil": 5.56,
    "Zimbabwe": 82.07,
    "Iraq": 35.00,
    "Bangladesh": 6.53,
    "China": 0.70,
    "Sweden": 89.00,
    "Tanzania": 21.67,
    "Cameroon": 37.99,
    "Morocco": 18.43,
    "Belgium": 59.05,
    "Israel": 31.60,
    "Austria": 73.08,
    "Romania": 30.98,
    "Greece": 50.98,
    "Czechia": 50.65,
    "Russia": 3.75,
    "Ireland": 97.52,
    "Sierra Leone": 83.53,
    "New Zealand": 97.15,
    "Denmark": 86.05,
    "Norway": 87.60,
    "Papua New Guinea": 70.43,
    "Hong Kong": 58.75,
    "Madagascar": 18.00,
    "Sri Lanka": 18.32,
    "Finland": 70.09,
    "Cambodia": 22.20,
    "Switzerland": 38.66,
    "Liberia": 82.67,
    "Jordan": 45.00,
    "Portugal": 27.30,
    "Argentina": 6.52,
    "Singapore": 74.21,
    "Jamaica": 97.64,
    "Algeria": 7.00,
    "Peru": 8.00,
    "Afghanistan": 6.00,
    "Hungary": 25.29,
    "Myanmar": 4.45,
    "Yemen": 9.00,
    "Colombia": 4.22,
    "Zambia": 16.02,
    "Bulgaria": 24.90,
    "Kazakhstan": 15.42,
    "Rwanda": 21.24,
    "Lebanon": 39.99,
    "Chile": 9.53,
    "Croatia": 39.66,
    "Slovakia": 25.69,
    "Slovenia": 59.02,
    "Trinidad and Tobago": 87.74,
    "Tunisia": 10.00,
    "Latvia": 45.89,
    "Lithuania": 31.09,
    "Uruguay": 24.00,
    "Guatemala": 5.00,
    "Guyana": 90.55,
    "Cyprus": 72.56,
    "Estonia": 47.03,
    "Botswana": 38.42,
    "Panama": 14.00,
    "Eswatini": 48.20,
    "Malawi": 3.88,
    "Lesotho": 27.86,
    "Solomon Islands": 72.88,
    "Malta": 88.48,
    "El Salvador": 6.88,
    "Suriname": 87.09,
    "Costa Rica": 8.15,
    "Iceland": 98.00,
    "Namibia": 17.24,
    "Barbados": 100.00,
    "Bahamas": 87.13,
    "Belize": 75.46,
    "Ecuador": 1.55,
    "Turkmenistan": 2.89,
    "Mauritius": 16.38,
    "Brunei": 37.76,
    "Armenia": 4.93,
    "Vanuatu": 57.47,
    "Azerbaijan": 1.29,
    "Luxembourg": 25.67,
    "Nepal": 0.35,
    "Isle of Man": 96.09,
    "Samoa": 49.86,
    "Micronesia": 57.66,
    "Kiribati": 72.91,
    "Marshall Islands": 98.31,
    "Palau": 92.50,
    "Tonga": 30.00,
    "Nauru": 96.67,
    "Andorra": 20.63,
    "Liechtenstein": 15.11,
    "Seychelles": 37.93,
    "Gambia": 2.34,
    "Antigua and Barbuda": 80.00,
    "Dominica": 94.03,
    "Saint Kitts and Nevis": 78.00,
    "Saint Vincent and the Grenadines": 95.00,
    "Saint Lucia": 43.03,
}


def flag_path(iso2: str) -> Path:
    FLAG_DIR.mkdir(parents=True, exist_ok=True)
    path = FLAG_DIR / f"{iso2.lower()}.png"
    if not path.exists():
        urlretrieve(f"https://flagcdn.com/w320/{iso2.lower()}.png", path)
    return path


def circular_flag_path(iso2: str) -> Path:
    """Crop a flag to a square (center crop) and mask it into a circle so it
    fully covers a round marker with no background showing through."""
    CIRCLE_FLAG_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CIRCLE_FLAG_DIR / f"{iso2.lower()}.png"
    if out_path.exists():
        return out_path

    img = Image.open(flag_path(iso2)).convert("RGBA")
    side = min(img.width, img.height)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side)).resize(
        (CIRCLE_SIZE, CIRCLE_SIZE), Image.LANCZOS
    )

    mask = Image.new("L", (CIRCLE_SIZE, CIRCLE_SIZE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, CIRCLE_SIZE, CIRCLE_SIZE), fill=255)
    img.putalpha(mask)

    border_width = max(2, CIRCLE_SIZE // 25)
    inset = border_width / 2
    ImageDraw.Draw(img).ellipse(
        (inset, inset, CIRCLE_SIZE - 1 - inset, CIRCLE_SIZE - 1 - inset),
        outline=(0, 0, 0, 255),
        width=border_width,
    )

    img.save(out_path)
    return out_path


def build_english_table() -> pd.DataFrame:
    rows = []
    for name, pct in ENGLISH_SPEAKING_PCT.items():
        code = find_country_code(name)
        if code is None:
            print(f"Could not resolve a country code for '{name}'")
            continue
        rows.append({"english_country": name, "iso2": code, "english_pct": pct})
    return pd.DataFrame(rows)


def build_country_stats() -> pd.DataFrame:
    avas_games = load_avas_words(find_latest("avas_????-??-??.csv"))
    games = load_games(avas_games)
    stats = country_stats(games)
    stats["iso2"] = stats["country"].apply(find_country_code)
    return stats


def merge_tables(english: pd.DataFrame, stats: pd.DataFrame) -> pd.DataFrame:
    merged = stats.merge(english, on="iso2", how="inner")
    dropped = merged[merged["games_played"] < MIN_GAMES]
    if len(dropped):
        print(
            f"Dropping {len(dropped)} countries with < {MIN_GAMES} games: "
            f"{sorted(dropped['country'])}"
        )
    return merged[merged["games_played"] >= MIN_GAMES].copy()


def plot(merged: pd.DataFrame):
    fig, ax = plt.subplots(figsize=(16, 10))

    merged = merged.sort_values("games_played")

    for _, row in merged.iterrows():
        try:
            img = mpimg.imread(circular_flag_path(row["iso2"]))
        except Exception as exc:
            print(f"Could not load flag for {row['country']}: {exc}")
            continue

        zoom = 0.09 + min(row["games_played"], 300) / 300 * 0.11
        imagebox = OffsetImage(img, zoom=zoom)
        ab = AnnotationBbox(
            imagebox,
            (row["english_pct"], row["win_rate"]),
            frameon=False,
            pad=0,
            zorder=row["games_played"],
        )
        ax.add_artist(ab)

    ax.set_xlim(merged["english_pct"].min() - 5, merged["english_pct"].max() + 5)
    ax.set_ylim(merged["win_rate"].min() - 5, merged["win_rate"].max() + 5)

    correlation = merged["english_pct"].corr(merged["win_rate"])

    ax.set_xlabel("% of country's population that speaks English")
    ax.set_ylabel("% of games player beat Ava")
    ax.set_title(
        f"English-speaking population vs. beating Ava at Boggle "
        f"(r = {correlation:.2f}, n = {len(merged)} countries)"
    )
    ax.grid(True, linestyle="--", alpha=0.3)

    plt.tight_layout()
    out_path = MAP_DIR / "english_speakers_vs_winrate.png"
    plt.savefig(out_path, dpi=150)
    print(f"Saved {out_path} ({len(merged)} countries, r = {correlation:.3f})")


def main():
    english = build_english_table()
    stats = build_country_stats()
    merged = merge_tables(english, stats)
    plot(merged)


if __name__ == "__main__":
    main()
