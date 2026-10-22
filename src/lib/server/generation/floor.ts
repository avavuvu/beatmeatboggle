import dictionaryManager from "../../dictionary/DictionaryManager"
import { solve } from "../../dictionary/solver"

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

export type Quality = {
    words: string[]
    len3: number
    len6plus: number
    len7plus: number
    plurals: number
    seedFound: boolean | null
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

export const quality = (letters: string[], size: number, seedWord: string | null): Quality => {
    const found = solve(letters, size)
    const list = [...found]
    return {
        words: list,
        len3: list.filter((w) => w.length === 3).length,
        len6plus: list.filter((w) => w.length >= 6).length,
        len7plus: list.filter((w) => w.length >= 7).length,
        plurals: list.filter(isPluralOnly).length,
        seedFound: seedWord ? found.has(seedWord) : null,
    }
}

export const failures = (q: Quality, floor: Floor): string[] => {
    const n = q.words.length
    const out: string[] = []
    if (n < floor.words) out.push("words")
    if (q.len6plus < floor.len6plus) out.push("len6plus")
    if (q.len7plus < floor.len7plus) out.push("len7plus")
    if (n && q.len3 / n > floor.len3Share) out.push("len3Share")
    if (n && q.plurals / n > floor.pluralShare) out.push("pluralShare")
    if (q.seedFound === false) out.push("seedMissing")
    return out
}

export const passesFloor = (q: Quality, floor: Floor) => failures(q, floor).length === 0

export const softScore = (q: Quality, floor: Floor) => {
    const n = q.words.length
    const below = (v: number, min: number) => (v < min ? (min - v) / min : 0)
    const above = (v: number, max: number) => (v > max ? (v - max) / max : 0)
    return (
        below(n, floor.words) * 3 +
        below(q.len6plus, floor.len6plus) * 2 +
        below(q.len7plus, floor.len7plus) +
        above(n ? q.len3 / n : 0, floor.len3Share) +
        above(n ? q.plurals / n : 0, floor.pluralShare) +
        (q.seedFound === false ? 5 : 0)
    )
}
