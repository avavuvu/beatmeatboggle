import seedrandom from "seedrandom"

export type Rng = () => number

export const rngFrom = (seed: string): Rng => seedrandom(seed)

export const shuffle = <T,>(rng: Rng, arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

export const pick = <T,>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)]

export const cumulative = (weights: number[]): number[] => {
    const out = new Array<number>(weights.length)
    let sum = 0
    for (let i = 0; i < weights.length; i++) out[i] = sum += weights[i]
    return out
}

export const pickWeighted = <T,>(rng: Rng, arr: T[], cum: number[]): T => {
    const r = rng() * cum[cum.length - 1]
    let lo = 0
    let hi = cum.length - 1
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (cum[mid] < r) lo = mid + 1
        else hi = mid
    }
    return arr[lo]
}

export const weightedPick = (rng: Rng, weights: Record<string, number>): string => {
    const entries = Object.entries(weights)
    const total = entries.reduce((s, [, w]) => s + w, 0)
    let r = rng() * total
    for (const [letter, w] of entries) {
        r -= w
        if (r <= 0) return letter
    }
    return entries[entries.length - 1][0]
}
