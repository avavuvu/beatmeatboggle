def word_length_to_points(word: str) -> int:
    return (len(word) ** 2) // 4


def calculate_score(words: list[str], avas_words: set[str]) -> int:
    total = 0
    for word in words:
        points = word_length_to_points(word)
        if word not in avas_words:
            points += 1
        total += points
    return total


def calculate_avas_score(
    avas_words: list[str], player_words: list[str], fair_fight: bool
) -> int:
    if fair_fight:
        return calculate_score(avas_words, set(player_words))
    return sum(word_length_to_points(word) for word in avas_words)
