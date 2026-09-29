import type { ScoreCount, WordStat } from "./statsTypes"
import { wordLengthToPoints } from "./scoring"

const COUNTRY_DISPLAY_NAMES: Record<string, string> = {
    "United Kingdom": "the UK",
    "United States": "the US",
    "The Netherlands": "the Netherlands",
    "Philippines": "the Philippines",
    "United Arab Emirates": "the UAE",
    "Dominican Republic": "the Dominican Republic",
    "Cayman Islands": "the Cayman Islands",
    "Northern Mariana Islands": "the Northern Mariana Islands",
    "Isle of Man": "the Isle of Man",
    "Maldives": "the Maldives",
    "Seychelles": "the Seychelles",
}

export const formatCountry = (country: string) => COUNTRY_DISPLAY_NAMES[country] ?? country

export const formatPercentage = (value: number) => `${value.toFixed(1)}%`

const toPercentage = (part: number, total: number) =>
    total > 0 ? (part / total) * 100 : 0

const byPlaysDescending = (a: WordStat, b: WordStat) =>
    b.plays - a.plays || b.word.length - a.word.length

const byPlaysAscending = (a: WordStat, b: WordStat) =>
    a.plays - b.plays || b.word.length - a.word.length

const countPlayers = (distribution: ScoreCount[], predicate: (score: number) => boolean) =>
    distribution.reduce((total, { score, count }) => (predicate(score) ? total + count : total), 0)

export const getFoundTogetherPercentage = (words: WordStat[]) =>
    toPercentage(words.filter(({ plays }) => plays > 0).length, words.length)

export const getFoundPercentage = (words: WordStat[], found: string[]) => {
    const foundSet = new Set(found)

    return toPercentage(words.filter(({ word }) => foundSet.has(word)).length, words.length)
}

export const getLongestWord = (words: WordStat[]) =>
    words.reduce<WordStat | null>(
        (longest, entry) => (!longest || entry.word.length > longest.word.length ? entry : longest),
        null
    )

export const getBestWord = (words: WordStat[]) => {
    let best: WordStat | null = null
    let bestValue = 0

    for (const entry of words) {
        const value = wordLengthToPoints(entry.word) * entry.plays

        if (value > bestValue || (value === bestValue && best && entry.word.length > best.word.length)) {
            best = entry
            bestValue = value
        }
    }

    return best
}

export const getAverageFoundWordLength = (words: WordStat[]) => {
    let letters = 0
    let plays = 0

    for (const entry of words) {
        letters += entry.word.length * entry.plays
        plays += entry.plays
    }

    return plays > 0 ? letters / plays : null
}

export const getRarestWords = (words: WordStat[], found: string[], limit: number) => {
    const foundSet = new Set(found)

    return words
        .filter(({ word }) => foundSet.has(word))
        .toSorted(byPlaysAscending)
        .slice(0, limit)
}

export const getMostCommonMissedWords = (words: WordStat[], found: string[], limit: number) => {
    const foundSet = new Set(found)

    return words
        .filter(({ word, plays }) => plays > 0 && !foundSet.has(word))
        .toSorted(byPlaysDescending)
        .slice(0, limit)
}

export const getAverageScore = (distribution: ScoreCount[], players: number) =>
    players > 0
        ? distribution.reduce((total, { score, count }) => total + score * count, 0) / players
        : null

export const getPercentile = (distribution: ScoreCount[], players: number, score: number) =>
    toPercentage(countPlayers(distribution, (other) => other < score), players)

export const getBeatScorePercentage = (distribution: ScoreCount[], players: number, score: number) =>
    toPercentage(countPlayers(distribution, (other) => other > score), players)

export const getRank = (distribution: ScoreCount[], score: number) =>
    countPlayers(distribution, (other) => other > score) + 1
