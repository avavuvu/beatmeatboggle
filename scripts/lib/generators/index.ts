import type { Rng } from "../rng"
import { constructBag } from "./bag"
import { constructClassic } from "./classic"
import { constructLegacy, CURRENT, FIXED } from "./legacy"
import { constructSpread } from "./spread"

export type Construction = "current" | "fixed" | "spread" | "classic" | "bag"

export const SEEDED: Construction[] = ["current", "fixed", "spread"]
export const WORDLESS: Construction[] = ["classic", "bag"]

export const isWordless = (c: Construction) => WORDLESS.includes(c)

export const construct = (
    construction: Construction,
    rng: Rng,
    size: number,
    seedWord: string | null
): string[] | null => {
    switch (construction) {
        case "classic":
            return constructClassic(rng, size)
        case "bag":
            return constructBag(rng, size)
        case "current":
            return constructLegacy(rng, size, seedWord!, CURRENT)
        case "fixed":
            return constructLegacy(rng, size, seedWord!, FIXED)
        case "spread":
            return constructSpread(rng, size, seedWord!)
    }
}

export { constructBag, constructClassic, constructLegacy, constructSpread, CURRENT, FIXED }
export { generateWithWordLegacy, generateClassicLegacy, drawProductionSeedWord } from "./legacy"
