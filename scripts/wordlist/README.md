# Word list

`static/wordList.txt` is built by `build.py` from two source lists that are **not committed** (licensing), plus three small files of human decisions that are.

```
uv run --project scripts python scripts/wordlist/build.py          # dry run: shows the diff
uv run --project scripts python scripts/wordlist/build.py --write  # rewrites static/wordList.txt
```

## Sources (`sources/`, gitignored)

| file | what | where | sha256 |
|---|---|---|---|
| `3of6game.txt` | 12dicts "3of6game" — the common-word core | http://wordlist.aspell.net/12dicts/ (alan beale; free, attribution requested) | `ad7b041b…dabf0` |
| `spreadthewordlist.dict` | Spread the Wordlist, `word;score` | https://www.spreadthewordlist.com/ (brian cimmet; free download, do not redistribute) | `25df7448…eb334` |
| `static/scrabble.txt` | the scrabble list already shipped with the site, used as the second filter for long words | in repo | — |

To rebuild on a new machine, download the first two into `sources/` and check the hashes with `shasum -a 256 sources/*`.

## Decisions (committed)

- `bad_words.txt` — stripped from 3of6game before anything else
- `manual_additions.txt` — added unconditionally (`pho`, `rego`, `ankh`, `noel` …)
- `removed.txt` — stripped from the final list. the first block is the "removed dud words" edit of 2026-10-15; the second block (`cark`, `cooee`, `hoon` …) are manual additions that the shipped list doesn't contain, kept here so the build reproduces the shipped list exactly. delete lines from here to put them back.

`build.py` with no flags reproduces `static/wordList.txt` byte for byte as of 2026-10-22.

## Frequency data

`wordfreq_en.tsv` is one Zipf frequency per word in the list, exported from [wordfreq](https://github.com/rspeer/wordfreq) by `wordfreq.py`. Zipf ≈ log10 of occurrences per billion words: 5+ everyday, 4 common, 3 known, 2 rare, < 1 effectively absent. wordfreq's data is CC-BY-SA 4.0, so this file is too; if it ships to the site it needs a credit line.

```
uv run --project scripts python scripts/wordlist/wordfreq.py
```

## Not carried over from cw-list

`cw-list` also held the crossword scoring tools (`clean`, `rescore`), Ava's own crossword list (`dv.dict`), and the Broda / jkugelman / STWL-fives lists. None of those feed the Boggle dictionary. The abandoned `overlap/main.py` pipeline and its `filter.txt` are gone too; note that `filter.txt` listed `chinks`, `chinked`, `chinking`, `sera`, `sot`, `sou` and the swear words, several of which are in the shipped list (the swears deliberately, for the dirty bonus). Worth a look.
