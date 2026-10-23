import { pick, pickWeighted, rngFrom, type Rng } from "./rng"
import { evaluate, type Metrics } from "./metrics"
import { construct, isWordless, type Construction } from "./generators"
import type { Pool } from "./pools"

export {
    REQUIREMENTS,
    WORDLESS_REQUIREMENTS,
    type BoardRequirements,
} from "../../src/lib/server/generation/requirements"
import {
    REQUIREMENTS,
    WORDLESS_REQUIREMENTS,
    meetsRequirements,
    shortfall,
    type BoardRequirements,
    type BoardStats,
} from "../../src/lib/server/generation/requirements"

export const requirementsFor = (construction: Construction, size: number) =>
    isWordless(construction) ? WORDLESS_REQUIREMENTS[size] : REQUIREMENTS[size]

const toStats = (m: Metrics): BoardStats => ({
    words: m.wordList,
    threeLetterWords: m.len3,
    wordsAtLeast6Letters: m.len6plus,
    wordsAtLeast7Letters: m.len7plus,
    plurals: m.plurals,
    seedWordFound: m.seedFound,
})

export type Selection = "single" | "refill" | "redraw"

export const SELECTIONS: Selection[] = ["single", "refill", "redraw"]

export const MAX_ATTEMPTS = 40

export type Result = {
    letters: string[]
    seedWord: string | null
    attempts: number
    passed: boolean
    metrics: Metrics
}

const drawWord = (rng: Rng, pool: Pool) => (pool.weights ? pickWeighted(rng, pool.words, pool.weights) : pick(rng, pool.words))

export const generate = (
    construction: Construction,
    selection: Selection,
    trialSeed: string,
    size: number,
    pool?: Pool
): Result => {
    const wordless = isWordless(construction)
    if (!wordless && !pool) throw new Error(`${construction} needs a pool`)

    const requirements = requirementsFor(construction, size)
    const first = rngFrom(trialSeed)
    const firstWord = wordless ? null : drawWord(first, pool!)

    let best: Result | null = null
    const attempts = selection === "single" ? 1 : MAX_ATTEMPTS

    for (let i = 0; i < attempts; i++) {
        const rng = i === 0 ? first : rngFrom(`${trialSeed}-${i}`)
        const seedWord = wordless ? null : selection === "redraw" && i > 0 ? drawWord(rng, pool!) : firstWord
        const letters = construct(construction, rng, size, seedWord)
        if (!letters) continue
        const metrics = evaluate(letters, size, seedWord)
        const passed = meetsRequirements(toStats(metrics), requirements)
        const result = { letters, seedWord, attempts: i + 1, passed, metrics }
        if (passed) return result
        if (!best || shortfall(toStats(metrics), requirements) < shortfall(toStats(best.metrics), requirements)) best = result
    }

    return { ...best!, attempts }
}
