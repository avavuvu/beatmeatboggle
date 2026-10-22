import { pick, pickWeighted, rngFrom, type Rng } from "./rng"
import { evaluate, type Metrics } from "./metrics"
import { construct, isWordless, type Construction } from "./generators"
import type { Pool } from "./pools"

export type Floor = {
    words: number
    len6plus: number
    len7plus: number
    len3Share: number
    pluralShare: number
}

export const FLOORS: Record<number, Floor> = {
    4: { words: 100, len6plus: 10, len7plus: 2, len3Share: 0.35, pluralShare: 0.3 },
    5: { words: 200, len6plus: 35, len7plus: 8, len3Share: 0.35, pluralShare: 0.3 },
}

export const WORDLESS_FLOORS: Record<number, Floor> = {
    4: { words: 90, len6plus: 4, len7plus: 1, len3Share: 0.45, pluralShare: 0.3 },
    5: { words: 180, len6plus: 15, len7plus: 3, len3Share: 0.45, pluralShare: 0.3 },
}

export const floorFor = (construction: Construction, size: number) =>
    isWordless(construction) ? WORDLESS_FLOORS[size] : FLOORS[size]

export const failures = (m: Metrics, floor: Floor): string[] => {
    const out: string[] = []
    if (m.words < floor.words) out.push("words")
    if (m.len6plus < floor.len6plus) out.push("len6plus")
    if (m.len7plus < floor.len7plus) out.push("len7plus")
    if (m.words && m.len3 / m.words > floor.len3Share) out.push("len3Share")
    if (m.words && m.plurals / m.words > floor.pluralShare) out.push("pluralShare")
    if (m.seedWord && !m.seedFound) out.push("seedMissing")
    return out
}

export const passesFloor = (m: Metrics, floor: Floor) => failures(m, floor).length === 0

const softScore = (m: Metrics, floor: Floor) => {
    const below = (v: number, min: number) => (v < min ? (min - v) / min : 0)
    const above = (v: number, max: number) => (v > max ? (v - max) / max : 0)
    return (
        below(m.words, floor.words) * 3 +
        below(m.len6plus, floor.len6plus) * 2 +
        below(m.len7plus, floor.len7plus) +
        above(m.words ? m.len3 / m.words : 0, floor.len3Share) +
        above(m.words ? m.plurals / m.words : 0, floor.pluralShare) +
        (m.seedWord && !m.seedFound ? 5 : 0)
    )
}

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

    const floor = floorFor(construction, size)
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
        const passed = passesFloor(metrics, floor)
        const result = { letters, seedWord, attempts: i + 1, passed, metrics }
        if (passed) return result
        if (!best || softScore(metrics, floor) < softScore(best.metrics, floor)) best = result
    }

    return { ...best!, attempts }
}
