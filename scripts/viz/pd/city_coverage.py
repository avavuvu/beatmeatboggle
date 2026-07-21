from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).parent.parent / "data"


def find_latest(pattern: str) -> Path:
    matches = sorted(DATA_DIR.glob(pattern))
    if not matches:
        raise FileNotFoundError(f"No files matching '{pattern}' in {DATA_DIR}")
    return matches[-1]


def main():
    path = find_latest("players_scored.csv")
    players = pd.read_csv(path)

    total = len(players)
    has_country = players["country"].notna()
    has_city = players["city"].notna()

    country_no_city = has_country & ~has_city

    n_has_country = sum(has_country)
    n_country_no_city = sum(country_no_city)

    print(f"Total rows: {total}")
    print(f"Rows with a country: {n_has_country}")
    print(f"Rows with a country but no city: {n_country_no_city}")
    print(f"  as a % of all rows: {n_country_no_city / total * 100:.2f}%")
    print(
        f"  as a % of rows that have a country: "
        f"{n_country_no_city / n_has_country * 100:.2f}%"
    )


if __name__ == "__main__":
    main()
