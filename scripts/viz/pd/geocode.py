from pathlib import Path
from typing import cast

import pandas as pd
from countrystatecity_countries import (
    get_country_by_code,
    search_cities,
    search_countries,
)
from timezonefinder import TimezoneFinder

DATA_DIR = Path(__file__).parent.parent / "data"

COUNTRY_ALIASES = {
    "czechia": "Czech Republic",
    "the netherlands": "Netherlands",
    "türkiye": "Turkey",
    "isle of man": "Man (Isle of)",
    "réunion": "Reunion",
}


def find_latest(pattern: str) -> Path:
    matches = sorted(DATA_DIR.glob(pattern))
    if not matches:
        raise FileNotFoundError(f"No files matching '{pattern}' in {DATA_DIR}")
    return matches[-1]


def find_country_code(name: str) -> str | None:
    query = COUNTRY_ALIASES.get(name.lower(), name)

    results = search_countries(query)
    if not results:
        return None

    exact = [c for c in results if c.name.lower() == query.lower()]
    match = exact[0] if exact else results[0]
    return match.iso2


def find_city_coords(country_code: str, city: str) -> tuple[float, float] | None:
    results = search_cities(country_code, None, city)
    if not results:
        return None

    exact = [c for c in results if c.name.lower() == city.lower()]
    match = exact[0] if exact else results[0]
    return float(match.latitude), float(match.longitude)


def find_country_coords(country_code: str) -> tuple[float, float] | None:
    country = get_country_by_code(country_code)
    if not country or not country.latitude or not country.longitude:
        return None
    return float(country.latitude), float(country.longitude)


def find_timezones(pairs: pd.DataFrame) -> pd.DataFrame:
    finder = TimezoneFinder()
    rows = []
    unresolved = 0

    for lat, lon in zip(pairs["lat"], pairs["lon"]):
        if pd.isna(lat) or pd.isna(lon):
            rows.append({"lat": lat, "lon": lon, "timezone": None})
            continue

        tz_name = finder.timezone_at(lat=lat, lng=lon)
        if tz_name is None:
            unresolved += 1
        rows.append({"lat": lat, "lon": lon, "timezone": tz_name})

    if unresolved:
        print(f"Could not resolve timezone for {unresolved} of {len(pairs)} coordinate pairs")

    return pd.DataFrame(rows)


def build_location_lookup(pairs: pd.DataFrame) -> pd.DataFrame:
    rows = []
    unmatched_countries = set()
    unmatched_cities = set()

    for country, city in zip(pairs["country"], pairs["city"]):
        if pd.isna(country):
            continue

        code = find_country_code(country)
        if code is None:
            unmatched_countries.add(country)
            rows.append({"country": country, "city": city, "lat": None, "lon": None})
            continue

        coords = None
        if not pd.isna(city):
            coords = find_city_coords(code, city)
            if coords is None:
                unmatched_cities.add((country, city))

        if coords is None:
            coords = find_country_coords(code)

        rows.append(
            {
                "country": country,
                "city": city,
                "lat": coords[0] if coords else None,
                "lon": coords[1] if coords else None,
            }
        )

    if unmatched_countries:
        print(
            f"Could not match {len(unmatched_countries)} countries: {sorted(unmatched_countries)}"
        )
    if unmatched_cities:
        print(
            f"Could not match {len(unmatched_cities)} cities (used country-level coords instead)"
        )

    return pd.DataFrame(rows)


def main():
    players_path = find_latest("players_scored.csv")
    players = pd.read_csv(players_path)

    pairs = cast(pd.DataFrame, players[["country", "city"]].drop_duplicates())

    lookup = build_location_lookup(pairs)

    coord_pairs = cast(pd.DataFrame, lookup[["lat", "lon"]].drop_duplicates())
    tz_lookup = find_timezones(coord_pairs)
    lookup = lookup.merge(tz_lookup, on=["lat", "lon"], how="left")

    merged = players.merge(lookup, on=["country", "city"], how="left")

    out_path = DATA_DIR / "players_geocoded.csv"
    merged.to_csv(out_path, index=False)

    n_located = sum(merged["lat"].notna())
    n_timezoned = sum(merged["timezone"].notna())
    print(f"Wrote {out_path} ({n_located} of {len(merged)} rows have coordinates, {n_timezoned} have a timezone)")


if __name__ == "__main__":
    main()
