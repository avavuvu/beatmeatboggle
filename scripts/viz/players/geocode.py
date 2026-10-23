import sys
from pathlib import Path
from typing import cast

import pandas as pd
from countrystatecity_countries import get_country_by_code, search_cities, search_countries
from timezonefinder import TimezoneFinder

sys.path.insert(0, str(Path(__file__).parent.parent))
from style import DATA

CACHE = DATA / "geocode_cache.csv"

COUNTRY_ALIASES = {
    "czechia": "Czech Republic",
    "the netherlands": "Netherlands",
    "türkiye": "Turkey",
    "isle of man": "Man (Isle of)",
    "réunion": "Reunion",
}

def find_country_code(name: str) -> str | None:
    query = COUNTRY_ALIASES.get(name.lower(), name)
    results = search_countries(query)
    if not results:
        return None
    exact = [c for c in results if c.name.lower() == query.lower()]
    return (exact[0] if exact else results[0]).iso2

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

def locate(country: str, city: str | None) -> tuple[float | None, float | None]:
    code = find_country_code(country)
    if code is None:
        return None, None
    coords = find_city_coords(code, city) if city else None
    coords = coords or find_country_coords(code)
    return coords if coords else (None, None)

def geocode(players: pd.DataFrame) -> pd.DataFrame:
    cache = pd.read_csv(CACHE) if CACHE.exists() else pd.DataFrame(columns=["country", "city", "lat", "lon", "timezone"])
    cache["city"] = cache["city"].fillna("")

    pairs = cast(pd.DataFrame, players[["country", "city"]].fillna("").drop_duplicates())
    pairs = pairs[pairs["country"] != ""]
    known = set(zip(cache["country"], cache["city"]))
    todo = [(c, ci) for c, ci in zip(pairs["country"], pairs["city"]) if (c, ci) not in known]

    if todo:
        finder = TimezoneFinder()
        rows = []
        for country, city in todo:
            lat, lon = locate(country, city or None)
            tz = finder.timezone_at(lat=lat, lng=lon) if lat is not None else None
            rows.append({"country": country, "city": city, "lat": lat, "lon": lon, "timezone": tz})
        cache = pd.concat([cache, pd.DataFrame(rows)], ignore_index=True)
        cache.to_csv(CACHE, index=False)
        print(f"geocoded {len(todo)} new country/city pairs ({cache['lat'].isna().sum()} unresolved in total)")

    out = players.copy()
    out["city"] = out["city"].fillna("")
    out["country"] = out["country"].fillna("")
    return out.merge(cache, on=["country", "city"], how="left")
