import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
SOURCES = HERE / "sources"
STATIC = HERE.parent.parent / "static"
TARGET = STATIC / "wordList.txt"
SCRABBLE = STATIC / "scrabble.txt"

MIN_LENGTH = 3
MIN_LONG_LENGTH = 5
STWL_REQUIRED_SCORE = 50

def lines(path: Path) -> list[str]:
    return [line.strip().lower() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

def build() -> list[str]:
    bad_words = set(lines(HERE / "bad_words.txt"))
    removed = set(lines(HERE / "removed.txt"))
    manual = set(lines(HERE / "manual_additions.txt"))

    words = set()
    for raw in lines(SOURCES / "3of6game.txt"):
        word = re.sub("[^a-z]+", "", raw)
        if len(word) >= MIN_LENGTH and word not in bad_words:
            words.add(word)

    words |= manual

    stwl = set()
    for raw in lines(SOURCES / "spreadthewordlist.dict"):
        word, score = raw.split(";")
        if len(word) >= MIN_LONG_LENGTH and int(score) == STWL_REQUIRED_SCORE:
            stwl.add(word)

    scrabble = {w for w in lines(SCRABBLE) if len(w) >= MIN_LONG_LENGTH}

    words |= stwl & scrabble
    words -= removed

    return sorted(words)

def main() -> None:
    words = build()
    current = set(lines(TARGET)) if TARGET.exists() else set()
    added = sorted(set(words) - current)
    dropped = sorted(current - set(words))

    print(f"{len(words)} words ({len(added)} added, {len(dropped)} dropped vs {TARGET.name})")
    if added:
        print("added:", " ".join(added[:40]), "..." if len(added) > 40 else "")
    if dropped:
        print("dropped:", " ".join(dropped[:40]), "..." if len(dropped) > 40 else "")

    if "--write" in sys.argv:
        TARGET.write_text("\n".join(words) + "\n", encoding="utf-8")
        print(f"wrote {TARGET}")

if __name__ == "__main__":
    main()
