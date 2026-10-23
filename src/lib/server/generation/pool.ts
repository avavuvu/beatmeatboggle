import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { cumulative, pickWeighted, type Rng } from "./rng"

export type SeedEntry = {
    word: string
    weight: number
    ladder: string[]
    zipf: number
    category: string
}

export type SeedPool = {
    words: SeedEntry[]
    cumulative: number[]
}

type PoolFile = {
    version: number
    source: string
    lengths: Record<string, [number, number]>
    words: [string, number, string[], number, string][]
}

let file: PoolFile | null = null
const pools = new Map<number, SeedPool>()
const ladders = new Map<string, string[]>()

export const loadSeedPoolFromDisk = async (): Promise<void> => {
    if (file) return
    file = JSON.parse(
        await readFile(join(process.cwd(), "static", "seedPool.json"), "utf8")
    ) as PoolFile
    for (const [word, , ladder] of file.words) ladders.set(word, ladder)
}

export const seedPool = (size: number): SeedPool => {
    if (!file) throw new Error("seed pool not loaded")
    const cached = pools.get(size)
    if (cached) return cached
    const [min, max] = file.lengths[String(size)]
    const words = file.words
        .filter(([word]) => word.length >= min && word.length <= max)
        .map(([word, weight, ladder, zipf, category]) => ({
            word,
            weight,
            ladder,
            zipf,
            category,
        }))
    const pool = { words, cumulative: cumulative(words.map((w) => w.weight)) }
    pools.set(size, pool)
    return pool
}

export const ladderOf = (word: string): string[] => ladders.get(word) ?? []

export const drawSeedWord = (rng: Rng, size: number): SeedEntry => {
    const pool = seedPool(size)
    return pickWeighted(rng, pool.words, pool.cumulative)
}
