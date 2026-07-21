import json
from pathlib import Path

import pandas as pd

from scoring import calculate_score

DATA_DIR = Path(__file__).parent.parent / "data"


def find_latest(pattern: str) -> Path:
    matches = sorted(DATA_DIR.glob(pattern))
    if not matches:
        raise FileNotFoundError(f"No files matching '{pattern}' in {DATA_DIR}")
    return matches[-1]


def parse_words(raw) -> list[str]:
    if pd.isna(raw) or not raw:
        return []
    return json.loads(raw)


def load_avas_words(path: Path) -> dict[str, set[str]]:
    avas = pd.read_csv(path, header=None, names=["dateKey", "words", "totalWords"])
    avas["words"] = avas["words"].apply(parse_words)
    return {date: set(words) for date, words in zip(avas["dateKey"], avas["words"])}


def load_players(path: Path) -> pd.DataFrame:
    players = pd.read_csv(
        path,
        header=None,
        names=[
            "id",
            "dateKey",
            "words",
            "score",
            "fairFight",
            "country",
            "city",
            "createdAt",
        ],
    )
    players["words"] = players["words"].apply(parse_words)
    return players


def drop_duplicates(players: pd.DataFrame) -> pd.DataFrame:
    players = players.copy()
    players["_words_key"] = players["words"].apply(tuple)

    players = players.drop_duplicates(subset=["dateKey", "_words_key"], keep="first")

    players = players.drop(columns=["_words_key"])

    return players


def backfill_scores(
    players: pd.DataFrame, avas_words_by_date: dict[str, set[str]]
) -> pd.DataFrame:
    players = players.copy()

    def estimate(row):
        if row["score"] != -1:
            return row["score"]
        avas_words = avas_words_by_date.get(row["dateKey"], set())
        return calculate_score(row["words"], avas_words)

    players["score"] = players.apply(estimate, axis=1)
    return players


def drop_no_ava_data(
    players: pd.DataFrame, avas_words_by_date: dict[str, set[str]]
) -> pd.DataFrame:
    known_dates = list(avas_words_by_date.keys())
    has_ava_data = players["dateKey"].isin(known_dates)

    return players.loc[has_ava_data].copy()


def main():
    avas_path = find_latest("avas_????-??-??.csv")
    players_path = find_latest("players_????-??-??.csv")

    print(f"Loading Ava's words from {avas_path.name}")
    avas_words_by_date = load_avas_words(avas_path)

    print(f"Loading player words from {players_path.name}")
    players = load_players(players_path)

    players = drop_duplicates(players)

    players = backfill_scores(players, avas_words_by_date)

    players = drop_no_ava_data(players, avas_words_by_date)

    out_path = DATA_DIR / "players_scored.csv"
    players.to_csv(out_path, index=False)
    print(f"Wrote {out_path} ({len(players)} rows)")


if __name__ == "__main__":
    main()
