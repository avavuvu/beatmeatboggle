import type { Dice } from "../../board"
import { rngFrom, type Rng } from "./rng"
import { FIXED, ORIGINAL, constructLegacy } from "./legacy"
import { constructBag, constructSpread } from "./bag"
import { constructClassic } from "./classic"
import { FLOORS, WORDLESS_FLOORS, failures, passesFloor, quality, softScore, type Floor, type Quality } from "./floor"
import { drawPlaceableProductionSeedWord, drawProductionSeedWord, drawSeedWord, ladderOf } from "./pool"

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

export const floorFor = (dice: Dice, size: number): Floor => (WORDLESS.includes(dice) ? WORDLESS_FLOORS : FLOORS)[size]

const construct = (dice: Dice, rng: Rng, size: number, seedWord: string | null): string[] | null => {
    switch (dice) {
        case "classic":
            return constructClassic(rng, size)
        case "bag":
            return constructBag(rng, size)
        case "word":
            return constructLegacy(rng, size, seedWord!, FIXED)
        case "spread":
            return constructSpread(rng, size, seedWord!)
    }
}

export const generateBoard = (dice: Dice, seed: string, size: number): GeneratedBoard => {
    const floor = floorFor(dice, size)
    const wordless = WORDLESS.includes(dice)
    let best: { letters: string[]; seedWord: string | null; q: Quality; attempts: number } | null = null

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const seedWord = wordless ? null : drawSeedWord(rngFrom(`${seed}-w${Math.floor(attempt / FILLS_PER_WORD)}`), size).word
        const letters = construct(dice, rngFrom(attempt === 0 ? seed : `${seed}-${attempt}`), size, seedWord)
        if (!letters) continue
        const q = quality(letters, size, seedWord)
        const candidate = { letters, seedWord, q, attempts: attempt + 1 }
        if (passesFloor(q, floor)) return finish(dice, candidate, true)
        if (!best || softScore(q, floor) < softScore(best.q, floor)) best = candidate
    }

    return finish(dice, { ...best!, attempts: MAX_ATTEMPTS }, false)
}

const finish = (
    dice: Dice,
    { letters, seedWord, q, attempts }: { letters: string[]; seedWord: string | null; q: Quality; attempts: number },
    passed: boolean
): GeneratedBoard => ({
    letters,
    seedWord,
    ladder: seedWord ? ladderOf(seedWord) : [],
    generator: dice,
    attempts,
    passed,
    words: q.words,
})

export const generateWithWordLegacy = (seed: string, size: number): string[] => {
    const rng = rngFrom(seed)
    return constructLegacy(rng, size, drawProductionSeedWord(rng), ORIGINAL)
}

export const generateClassicLegacy = (seed: string, size: number): string[] => constructClassic(rngFrom(seed), size)

export { constructLegacy, constructSpread, constructBag, constructClassic, ORIGINAL, FIXED }
export { FLOORS, WORDLESS_FLOORS, failures, passesFloor, quality, softScore, type Floor, type Quality }
export { drawPlaceableProductionSeedWord, drawProductionSeedWord, drawSeedWord }
