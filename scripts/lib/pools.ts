import { cumulative } from "./rng"
import { allWords, isPlaceable, isPluralOnly, zipfOf } from "./words"
import { ladderWeight } from "./ladders"

export type BoardSize = 4 | 5

export const PRODUCTION_LENGTHS: [number, number] = [9, 11]

export const SEED_LENGTHS: Record<BoardSize, [number, number]> = {
    4: [8, 10],
    5: [9, 12],
}

export type Pool = {
    name: string
    words: string[]
    weights?: number[]
}

const inRange = (w: string, [min, max]: [number, number]) => w.length >= min && w.length <= max

export const productionPool = (): Pool => ({
    name: "production",
    words: allWords().filter((w) => inRange(w, PRODUCTION_LENGTHS)),
})

export const placeablePool = (): Pool => ({
    name: "placeable",
    words: productionPool().words.filter(isPlaceable),
})

export const curatedPool = (size: BoardSize): Pool => ({
    name: `curated${size}`,
    words: allWords().filter((w) => inRange(w, SEED_LENGTHS[size]) && !isPluralOnly(w) && isPlaceable(w)),
})

export const ladderPool = (size: BoardSize): Pool => {
    const words = curatedPool(size).words.filter((w) => zipfOf(w) >= 1)
    return { name: `ladder${size}`, words, weights: cumulative(words.map(ladderWeight)) }
}

export const singleWordPool = (word: string): Pool => ({ name: word, words: [word] })
