import { pick, shuffle, type Rng } from "./rng"

const DICE = [
    "AACIOT", "ABILTY", "ABJMOQ", "ACDEMP",
    "ACELRS", "ADENVZ", "AHMORS", "BIFORX",
    "DENOSW", "DKNOTU", "EEFHIY", "EGKLUY",
    "EGINTV", "EHINPS", "ELPSTU", "GILRUW",
]

export const constructClassic = (rng: Rng, size: number): string[] => {
    const dice = shuffle(rng, [...DICE])
    return Array.from({ length: size * size }, (_, index) =>
        pick(rng, dice[index % dice.length].split("")).toLowerCase()
    )
}
