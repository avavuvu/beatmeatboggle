from ast import literal_eval
from collections import Counter
from pathlib import Path

import pandas as pd

from main import find_latest, load_avas_words
from scoring import calculate_avas_score

DATA_DIR = Path(__file__).parent.parent / "data"


def main():
    path = DATA_DIR / "players_scored.csv"
    players = pd.read_csv(path)

    avas_words_by_date = load_avas_words(find_latest("avas_????-??-??.csv"))

    games = players.copy()

    def beat_ava(row) -> bool:
        avas_words = list(avas_words_by_date.get(row["dateKey"], set()))
        player_words = literal_eval(row["words"])
        fair_fight = row["fairFight"] == 1.0

        avas_score = calculate_avas_score(avas_words, player_words, fair_fight)
        return row["score"] > avas_score

    games["beat_ava"] = games.apply(beat_ava, axis=1)

    ava_won = (~games["beat_ava"]).sum()
    total_games = len(games)
    percent = ava_won / total_games * 100

    print(f"{ava_won} {total_games} {percent:02f}%")

    print(games[["dateKey", "score", "beat_ava"]])

    player_word_counts = Counter()
    for words in games["words"]:
        player_word_counts.update(literal_eval(words))

    avas_word_counts = Counter()
    for words in avas_words_by_date.values():
        avas_word_counts.update(words)

    most_common_player_word = player_word_counts.most_common(20)
    most_common_avas_word = avas_word_counts.most_common(20)

    print(f"Most common player word: {most_common_player_word} games)")
    print(f"Most common Ava word: {most_common_avas_word} days)")


if __name__ == "__main__":
    main()
