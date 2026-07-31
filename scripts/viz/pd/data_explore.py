from ast import literal_eval
from collections import Counter
from pathlib import Path
from typing import cast

import asciibars
import matplotlib as mpl
import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.ticker import FuncFormatter, MultipleLocator

from main import find_latest, load_avas_words
from scoring import calculate_avas_score

# mpl.use("module://mpl_ascii")

DATA_DIR = Path(__file__).parent.parent / "data"


def main():
    path = DATA_DIR / "players_geocoded.csv"
    players = pd.read_csv(path)

    games = players.copy()
    avas_games = load_avas_words(find_latest("avas_????-??-??.csv"))

    most_common_word(games, avas_games)
    most_common_word(games, avas_games, weekdays={"Monday", "Tuesday"})
    most_common_word(games, avas_games, weekdays={"Monday", "Tuesday"}, exclude_weekdays=True)

    longest_words(games)

    percentage_beat_ava(games, avas_games)

    score_by_local_time(games, avas_games)

def beat_ava(row, avas_games: dict[str, set[str]], force_fair_fight: bool) -> bool:
    avas_words = list(avas_games.get(row["dateKey"], set()))
    player_words = literal_eval(row["words"])
    fair_fight = row["fairFight"] == 1.0 if not force_fair_fight else True

    avas_score = calculate_avas_score(avas_words, player_words, fair_fight)
    return row["score"] > avas_score

def percentage_beat_ava(games: pd.DataFrame, avas_games: dict[str, set[str]]):
    games["beat_ava"] = games.apply(lambda row: beat_ava(row, avas_games, False), axis=1)
    games["beat_ava_fair"] = games.apply(lambda row: beat_ava(row, avas_games, True), axis=1)

    ava_won = (~games["beat_ava"]).sum()
    ava_won_fair = (~games["beat_ava_fair"]).sum()
    total_games = len(games)
    data = [
        ("Ava won (true)",ava_won / total_games * 100),
        ("Ava won (technically)",ava_won_fair / total_games * 100),
        ("P", 100)
    ]
    asciibars.plot(data, neg_unit="░", max_length=50)

def format_hour_label(hour_float: float, _pos=None) -> str:
    total_minutes = round(hour_float * 60) % (24 * 60)
    hour24 = total_minutes // 60
    minute = total_minutes % 60

    period = "AM" if hour24 < 12 else "PM"
    hour12 = hour24 % 12 or 12

    if minute == 0:
        return f"{hour12} {period}"
    return f"{hour12}:{minute:02d} {period}"

def local_half_hour(group: pd.DataFrame) -> pd.Series:
    tz_name = group.name
    local_time = group["created_at_utc"].dt.tz_convert(tz_name)
    return local_time.dt.hour + (local_time.dt.minute // 30) * 0.5

def drop_backfilled_timestamps(games: pd.DataFrame) -> pd.DataFrame:
    counts = cast(pd.Series, games["createdAt"]).value_counts()
    bogus_values = list(cast(pd.Series, counts[counts > 1]).index)

    if bogus_values:
        n_dropped = cast(pd.Series, games["createdAt"]).isin(bogus_values).sum()
        print(
            f"Dropping {n_dropped} rows with shared/backfilled createdAt values: {bogus_values}"
        )

    return cast(pd.DataFrame, games[~cast(pd.Series, games["createdAt"]).isin(bogus_values)])

def score_by_local_time(games: pd.DataFrame, avas_games: dict[str, set[str]]):
    games = cast(pd.DataFrame, games.dropna(subset=["timezone"]).copy())
    games = drop_backfilled_timestamps(games)

    games["beat_ava"] = games.apply(lambda row: beat_ava(row, avas_games, False), axis=1)
    games["created_at_utc"] = pd.to_datetime(games["createdAt"], unit="ms", utc=True)

    games["local_half_hour"] = games.groupby("timezone", group_keys=False).apply(local_half_hour)

    grouped = games.groupby("local_half_hour")["beat_ava"]
    win_rate = cast(pd.Series, grouped.mean()).sort_index() * 100
    sample_counts = cast(pd.Series, grouped.size()).sort_index()

    counts_table = pd.DataFrame({
        "local_time": [format_hour_label(hour) for hour in sample_counts.index],
        "games": sample_counts.values,
        "win_rate": win_rate.values,
    })
    print(counts_table.to_string(index=False))

    _fig, win_rate_axis = plt.subplots()

    win_rate_axis.plot(win_rate.index.to_numpy(), win_rate.to_numpy(), marker="o", color="tab:blue", label="Win rate")
    win_rate_axis.set_xlabel("Time of day")
    win_rate_axis.set_ylabel("% of players that beat Ava", color="tab:blue")
    win_rate_axis.xaxis.set_major_formatter(FuncFormatter(format_hour_label))
    win_rate_axis.xaxis.set_major_locator(MultipleLocator(2))

    games_axis = win_rate_axis.twinx()
    games_axis.plot(sample_counts.index.to_numpy(), sample_counts.to_numpy(), color="tab:orange", linestyle="--", label="Games played")
    games_axis.set_ylabel("Games played", color="tab:orange")

    plt.savefig("./graphs/time.png")
    plt.show()

def longest_words(games: pd.DataFrame):
    words = cast(pd.Series, games["words"].apply(literal_eval))
    all_words = set(words.explode())
    longest = sorted(all_words, key=len, reverse=True)

    top_words = longest[:100]
    table = pd.DataFrame({"word": top_words, "length": [len(word) for word in top_words]})
    print(table.to_string(index=False))

def filter_by_weekday(
    games: pd.DataFrame,
    avas_words: dict[str, set[str]],
    weekdays: set[str],
    exclude: bool = False,
) -> tuple[pd.DataFrame, dict[str, set[str]]]:
    game_weekday = pd.to_datetime(games["dateKey"]).dt.day_name()
    matches = game_weekday.isin(weekdays)
    if exclude:
        matches = ~matches
    filtered_games = cast(pd.DataFrame, games[matches])

    def date_matches(date) -> bool:
        is_match = pd.to_datetime(date).day_name() in weekdays
        return not is_match if exclude else is_match

    filtered_avas_words = {
        date: words for date, words in avas_words.items() if date_matches(date)
    }

    return filtered_games, filtered_avas_words

def most_common_word(
    games: pd.DataFrame,
    avas_words: dict[str, set[str]],
    weekdays: set[str] | None = None,
    exclude_weekdays: bool = False,
):
    if weekdays:
        games, avas_words = filter_by_weekday(games, avas_words, weekdays, exclude_weekdays)

    player_word_counts = Counter()
    for words in games["words"]:
        player_word_counts.update(literal_eval(words))

    avas_word_counts = Counter()
    for words in avas_words.values():
        avas_word_counts.update(words)

    most_common_player_word = player_word_counts.most_common(5)
    most_common_avas_word = avas_word_counts.most_common(5)

    if weekdays:
        prefix = "not " if exclude_weekdays else ""
        label = f" ({prefix}{', '.join(sorted(weekdays))}, {len(games)} games)"
    else:
        label = ""
    print(f"Most commonly played words{label}")
    asciibars.plot(most_common_player_word, neg_unit="░")
    print(f"Ava's most commonly played words{label}")
    asciibars.plot(most_common_avas_word, neg_unit="░")

if __name__ == "__main__":
    main()
