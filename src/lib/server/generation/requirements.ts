import dictionaryManager from "../../dictionary/DictionaryManager"
import { solve } from "../../dictionary/solver"

export type BoardRequirements = {
    minWords: number
    minWordsAtLeast6Letters: number
    minWordsAtLeast7Letters: number
    maxShareOf3LetterWords: number
    maxShareOfPlurals: number
}

export const REQUIREMENTS: Record<number, BoardRequirements> = {
    4: {
        minWords: 100,
        minWordsAtLeast6Letters: 10,
        minWordsAtLeast7Letters: 2,
        maxShareOf3LetterWords: 0.35,
        maxShareOfPlurals: 0.3,
    },
    5: {
        minWords: 200,
        minWordsAtLeast6Letters: 35,
        minWordsAtLeast7Letters: 8,
        maxShareOf3LetterWords: 0.35,
        maxShareOfPlurals: 0.3,
    },
}

export const WORDLESS_REQUIREMENTS: Record<number, BoardRequirements> = {
    4: {
        minWords: 90,
        minWordsAtLeast6Letters: 4,
        minWordsAtLeast7Letters: 1,
        maxShareOf3LetterWords: 0.45,
        maxShareOfPlurals: 0.3,
    },
    5: {
        minWords: 180,
        minWordsAtLeast6Letters: 15,
        minWordsAtLeast7Letters: 3,
        maxShareOf3LetterWords: 0.45,
        maxShareOfPlurals: 0.3,
    },
}

export type BoardStats = {
    words: string[]
    threeLetterWords: number
    wordsAtLeast6Letters: number
    wordsAtLeast7Letters: number
    plurals: number
    seedWordFound: boolean | null
}

let wordSet: Set<string> | null = null
let wordSetFor: string[] | null = null

const words = () => {
    if (wordSetFor !== dictionaryManager.list) {
        wordSet = new Set(dictionaryManager.list)
        wordSetFor = dictionaryManager.list
    }
    return wordSet!
}

export const isPluralOnly = (w: string) => {
    const set = words()
    return (
        (w.endsWith("s") && set.has(w.slice(0, -1))) ||
        (w.endsWith("es") && set.has(w.slice(0, -2))) ||
        (w.endsWith("ies") && set.has(w.slice(0, -3) + "y"))
    )
}

export const measureBoard = (
    letters: string[],
    size: number,
    seedWord: string | null
): BoardStats => {
    const found = solve(letters, size)
    const list = [...found]
    return {
        words: list,
        threeLetterWords: list.filter((w) => w.length === 3).length,
        wordsAtLeast6Letters: list.filter((w) => w.length >= 6).length,
        wordsAtLeast7Letters: list.filter((w) => w.length >= 7).length,
        plurals: list.filter(isPluralOnly).length,
        seedWordFound: seedWord ? found.has(seedWord) : null,
    }
}

export const unmetRequirements = (
    stats: BoardStats,
    requirements: BoardRequirements
): string[] => {
    const total = stats.words.length
    const unmet: string[] = []
    if (total < requirements.minWords) unmet.push("minWords")
    if (stats.wordsAtLeast6Letters < requirements.minWordsAtLeast6Letters)
        unmet.push("minWordsAtLeast6Letters")
    if (stats.wordsAtLeast7Letters < requirements.minWordsAtLeast7Letters)
        unmet.push("minWordsAtLeast7Letters")
    if (total && stats.threeLetterWords / total > requirements.maxShareOf3LetterWords)
        unmet.push("maxShareOf3LetterWords")
    if (total && stats.plurals / total > requirements.maxShareOfPlurals)
        unmet.push("maxShareOfPlurals")
    if (stats.seedWordFound === false) unmet.push("seedWordFound")
    return unmet
}

export const meetsRequirements = (
    stats: BoardStats,
    requirements: BoardRequirements
) => unmetRequirements(stats, requirements).length === 0

export const shortfall = (
    stats: BoardStats,
    requirements: BoardRequirements
) => {
    const total = stats.words.length
    const under = (value: number, min: number) =>
        value < min ? (min - value) / min : 0
    const over = (value: number, max: number) =>
        value > max ? (value - max) / max : 0
    return (
        under(total, requirements.minWords) * 3 +
        under(stats.wordsAtLeast6Letters, requirements.minWordsAtLeast6Letters) * 2 +
        under(stats.wordsAtLeast7Letters, requirements.minWordsAtLeast7Letters) +
        over(total ? stats.threeLetterWords / total : 0, requirements.maxShareOf3LetterWords) +
        over(total ? stats.plurals / total : 0, requirements.maxShareOfPlurals) +
        (stats.seedWordFound === false ? 5 : 0)
    )
}
