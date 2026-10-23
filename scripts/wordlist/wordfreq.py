from pathlib import Path

from wordfreq import zipf_frequency

HERE = Path(__file__).parent
WORDS = HERE.parent.parent / "static" / "wordList.txt"
OUT = HERE / "wordfreq_en.tsv"

def main() -> None:
    words = [w.strip() for w in WORDS.read_text().splitlines() if len(w.strip()) >= 3]
    rows = [(w, zipf_frequency(w, "en")) for w in words]
    OUT.write_text("\n".join(f"{w}\t{z:.2f}" for w, z in rows) + "\n")

    known = sum(1 for _, z in rows if z > 0)
    print(f"{len(rows)} words, {known} with a nonzero frequency, written to {OUT}")

    print("zipf distribution:")
    for lo, hi in [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 8)]:
        n = sum(1 for _, z in rows if lo <= z < hi)
        print(f"  {lo}–{hi}: {n:6d}  {n / len(rows) * 100:5.1f}%")

if __name__ == "__main__":
    main()
