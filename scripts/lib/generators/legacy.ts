import { getAdjacentPositions } from "../../../src/lib/constants"
import { solve } from "../../../src/lib/dictionary/solver"
import dictionaryManager from "../../../src/lib/dictionary/DictionaryManager"
import { pick, rngFrom, shuffle, type Rng } from "../../../src/lib/server/generation/rng"
import { CONSONANT_POOL, VOWEL_POOL, isVowel } from "../../../src/lib/server/generation/letters"
import { constructClassic } from "../../../src/lib/server/generation/classic"
import { PRODUCTION_LENGTHS } from "../pools"

export type LegacyOptions = {
    noDoubleBonus: boolean
    weightedVowelFill: boolean
    weightedRepair: boolean
}

export const CURRENT: LegacyOptions = {
    noDoubleBonus: false,
    weightedVowelFill: false,
    weightedRepair: false,
}
export const FIXED: LegacyOptions = {
    noDoubleBonus: true,
    weightedVowelFill: true,
    weightedRepair: true,
}

const usedLetters = (board: string[], size: number) =>
    new Set([...solve(board, size)].join(""))

export const constructLegacy = (
    rng: Rng,
    size: number,
    chosen: string,
    opts: LegacyOptions
): string[] => {
    const seedWord = chosen.includes("qu") ? chosen.replace("qu", "q") : chosen
    const board = Array.from({ length: size * size }, () => "")

    const chebyshev = (a: number, b: number) =>
        Math.max(
            Math.abs((a % size) - (b % size)),
            Math.abs(Math.floor(a / size) - Math.floor(b / size))
        )

    const neighborsWith = (position: number, letter: string) =>
        getAdjacentPositions(position, size).filter(
            (index) => board[index] === letter
        )

    const createsBadDouble = (candidate: number, letter: string) =>
        "auiqwyhkxcv".includes(letter) &&
        neighborsWith(candidate, letter).length > 0

    const createsTriple = (candidate: number, letter: string) => {
        const same = neighborsWith(candidate, letter)
        return (
            same.length >= 2 ||
            same.some((neighbor) =>
                neighborsWith(neighbor, letter).some(
                    (index) => index !== candidate
                )
            )
        )
    }

    const isAllowed = (candidate: number, letter: string) =>
        !createsBadDouble(candidate, letter) &&
        !createsTriple(candidate, letter)

    const scoreCandidate = (candidate: number, letter: string) => {
        const vowel = isVowel(letter)
        const opposite = board.flatMap((tile, index) =>
            tile !== "" && isVowel(tile) !== vowel ? [index] : []
        )
        const averageDistance =
            opposite.length === 0
                ? 0
                : opposite.reduce(
                      (sum, index) => sum + chebyshev(candidate, index),
                      0
                  ) / opposite.length
        const doubleBonus =
            !opts.noDoubleBonus &&
            "oe".includes(letter) &&
            neighborsWith(candidate, letter).length > 0
                ? 2
                : 0
        return doubleBonus - averageDistance
    }

    const rankedBy = <T>(items: T[], score: (item: T) => number) =>
        shuffle(rng, [...items]).sort((a, b) => score(b) - score(a))

    const tryPlace = (letterIndex: number, position: number): boolean => {
        board[position] = seedWord[letterIndex]
        if (letterIndex === seedWord.length - 1) return true
        const nextLetter = seedWord[letterIndex + 1]
        const candidates = rankedBy(
            getAdjacentPositions(position, size).filter(
                (c) => board[c] === "" && isAllowed(c, nextLetter)
            ),
            (c) => scoreCandidate(c, nextLetter)
        )
        if (candidates.some((c) => tryPlace(letterIndex + 1, c))) return true
        board[position] = ""
        return false
    }

    shuffle(
        rng,
        Array.from({ length: board.length }, (_, i) => i)
    ).some((start) => tryPlace(0, start))

    const filledNeighbors = (cell: number) =>
        getAdjacentPositions(cell, size).filter((index) => board[index] !== "")
            .length

    const emptyCells = board.flatMap((tile, index) =>
        tile === "" ? [index] : []
    )
    const fillVowels = opts.weightedVowelFill ? VOWEL_POOL : "aeiou".split("")

    while (emptyCells.length > 0) {
        emptyCells.sort((a, b) => filledNeighbors(b) - filledNeighbors(a))
        const cell = emptyCells.shift()!
        const ranked = rankedBy(
            rng() < 0.46 ? fillVowels : CONSONANT_POOL,
            (letter) => scoreCandidate(cell, letter)
        )
        board[cell] =
            ranked.find((letter) => isAllowed(cell, letter)) ?? ranked[0]
    }

    const repairPool = opts.weightedRepair
        ? [...VOWEL_POOL, ...CONSONANT_POOL]
        : "abcdefghijklmnopqrstuvwxyz".split("")
    for (let attempt = 0; attempt < 20; attempt++) {
        const used = usedLetters(board, size)
        const dead = board.flatMap((letter, index) =>
            used.has(letter) ? [] : [index]
        )
        if (dead.length === 0) break
        for (const index of dead) board[index] = pick(rng, repairPool)
    }

    return board
}

export const drawProductionSeedWord = (rng: Rng): string =>
    pick(
        rng,
        dictionaryManager.list.filter(
            (w) => w.length >= PRODUCTION_LENGTHS[0] && w.length <= PRODUCTION_LENGTHS[1]
        )
    )

export const generateWithWordLegacy = (seed: string, size: number): string[] => {
    const rng = rngFrom(seed)
    return constructLegacy(rng, size, drawProductionSeedWord(rng), CURRENT)
}

export const generateClassicLegacy = (seed: string, size: number): string[] =>
    constructClassic(rngFrom(seed), size)
