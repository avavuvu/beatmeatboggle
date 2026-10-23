import type { Dice } from "../../board"
import { rngFrom, type Rng } from "./rng"
import { constructWord } from "./word"
import { constructBag, constructSpread } from "./bag"
import { constructClassic } from "./classic"
import {
    REQUIREMENTS,
    WORDLESS_REQUIREMENTS,
    unmetRequirements,
    meetsRequirements,
    measureBoard,
    shortfall,
    type BoardRequirements,
    type BoardStats,
} from "./requirements"
import { drawSeedWord, ladderOf } from "./pool"

export type GeneratedBoard = {
    letters: string[]
    seedWord: string | null
    ladder: string[]
    generator: Dice
    attempts: number
    passed: boolean
    words: string[]
}

export const MAX_ATTEMPTS = 40
export const FILLS_PER_WORD = 6

const WORDLESS: Dice[] = ["classic", "bag"]

export const requirementsFor = (dice: Dice, size: number): BoardRequirements =>
    (WORDLESS.includes(dice) ? WORDLESS_REQUIREMENTS : REQUIREMENTS)[size]

const construct = (
    dice: Dice,
    rng: Rng,
    size: number,
    seedWord: string | null
): string[] | null => {
    switch (dice) {
        case "classic":
            return constructClassic(rng, size)
        case "bag":
            return constructBag(rng, size)
        case "word":
            return constructWord(rng, size, seedWord!)
        case "spread":
            return constructSpread(rng, size, seedWord!)
    }
}

export const generateBoard = (
    dice: Dice,
    seed: string,
    size: number
): GeneratedBoard => {
    const requirements = requirementsFor(dice, size)
    const wordless = WORDLESS.includes(dice)
    let best: {
        letters: string[]
        seedWord: string | null
        stats: BoardStats
        attempts: number
    } | null = null

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const seedWord = wordless
            ? null
            : drawSeedWord(
                  rngFrom(`${seed}-w${Math.floor(attempt / FILLS_PER_WORD)}`),
                  size
              ).word
        const letters = construct(
            dice,
            rngFrom(attempt === 0 ? seed : `${seed}-${attempt}`),
            size,
            seedWord
        )
        if (!letters) continue
        const stats = measureBoard(letters, size, seedWord)
        const candidate = { letters, seedWord, stats, attempts: attempt + 1 }
        if (meetsRequirements(stats, requirements)) return finish(dice, candidate, true)
        if (!best || shortfall(stats, requirements) < shortfall(best.stats, requirements))
            best = candidate
    }

    return finish(dice, { ...best!, attempts: MAX_ATTEMPTS }, false)
}

const finish = (
    dice: Dice,
    {
        letters,
        seedWord,
        stats,
        attempts,
    }: {
        letters: string[]
        seedWord: string | null
        stats: BoardStats
        attempts: number
    },
    passed: boolean
): GeneratedBoard => ({
    letters,
    seedWord,
    ladder: seedWord ? ladderOf(seedWord) : [],
    generator: dice,
    attempts,
    passed,
    words: stats.words,
})

export { constructWord, constructSpread, constructBag, constructClassic }
export {
    REQUIREMENTS,
    WORDLESS_REQUIREMENTS,
    unmetRequirements,
    meetsRequirements,
    measureBoard,
    shortfall,
    type BoardRequirements,
    type BoardStats,
}
export { drawSeedWord }
