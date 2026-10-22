import { getAdjacentPositions } from "../../src/lib/constants"
import { wordLengthToPoints } from "../../src/lib/scoring"
import { findPath, isVowel, solveWithTiles } from "./solver"
import { inflectionOf, isPluralOnly, type Inflection } from "./words"

export type Metrics = {
    letters: string
    size: number
    seedWord: string | null
    seedInflection: Inflection | null
    seedFound: boolean | null
    seedPath: number[]
    words: number
    score: number
    vowels: number
    distinct: number
    maxRepeat: number
    e: number
    s: number
    rare: number
    adjSame: number
    adjEE: number
    adjOO: number
    len3: number
    len4: number
    len5: number
    len6plus: number
    len7plus: number
    plurals: number
    hubShare: number
    weakTiles: number
    longest: string
    wordList: string[]
}

export const evaluate = (letters: string[], size: number, seedWord: string | null): Metrics => {
    const found = solveWithTiles(letters, size)
    const words = [...found.keys()]
    const n = letters.length

    const counts: Record<string, number> = {}
    for (const l of letters) counts[l] = (counts[l] ?? 0) + 1

    let adjSame = 0
    let adjEE = 0
    let adjOO = 0
    for (let i = 0; i < n; i++) {
        for (const j of getAdjacentPositions(i, size)) {
            if (j > i && letters[i] === letters[j]) {
                adjSame++
                if (letters[i] === "e") adjEE++
                if (letters[i] === "o") adjOO++
            }
        }
    }

    const tileUse = new Array<number>(n).fill(0)
    for (const tiles of found.values()) for (const t of tiles) tileUse[t]++

    const byLen = (p: (l: number) => boolean) => words.filter((w) => p(w.length)).length

    return {
        letters: letters.join(""),
        size,
        seedWord,
        seedInflection: seedWord ? inflectionOf(seedWord) : null,
        seedFound: seedWord ? found.has(seedWord) : null,
        seedPath: seedWord ? (findPath(letters, size, seedWord) ?? []) : [],
        words: words.length,
        score: words.reduce((s, w) => s + wordLengthToPoints(w), 0),
        vowels: letters.filter(isVowel).length,
        distinct: Object.keys(counts).length,
        maxRepeat: Math.max(...Object.values(counts)),
        e: counts.e ?? 0,
        s: counts.s ?? 0,
        rare: letters.filter((l) => "jqxz".includes(l)).length,
        adjSame,
        adjEE,
        adjOO,
        len3: byLen((l) => l === 3),
        len4: byLen((l) => l === 4),
        len5: byLen((l) => l === 5),
        len6plus: byLen((l) => l >= 6),
        len7plus: byLen((l) => l >= 7),
        plurals: words.filter(isPluralOnly).length,
        hubShare: words.length ? Math.max(...tileUse) / words.length : 0,
        weakTiles: tileUse.filter((u) => u < words.length * 0.05).length,
        longest: words.reduce((a, b) => (b.length > a.length ? b : a), ""),
        wordList: words,
    }
}

export const flatMetrics = ({ wordList, seedPath, ...rest }: Metrics) => rest
