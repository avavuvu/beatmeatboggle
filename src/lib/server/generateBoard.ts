import seedrandom from "seedrandom"
import { getAdjacentPositions } from "../constants"
import { solve } from "../dictionary/solver"
import dictionaryManager from "../dictionary/DictionaryManager"

type Rng = () => number

const shuffle = <T,>(rng: Rng, arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

const pick = <T,>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)]

const vowelPool = "eeeeeeeeeeeaaaaaaiiiiiiooooooouuu".split("")
const consonantPool = "llllnnnnnnsssssstttttttttdddrrrrrbbccgghhhhhmmppyyyffkvvwwwjqxz".split("")

const isVowel = (letter: string) => "aeiou".includes(letter)

export const generateClassic = (seed: string, gridSize: number): string[] => {
    const rng = seedrandom(seed)

    const dice = shuffle(rng, [
        "AACIOT", "ABILTY", "ABJMOQ", "ACDEMP",
        "ACELRS", "ADENVZ", "AHMORS", "BIFORX",
        "DENOSW", "DKNOTU", "EEFHIY", "EGKLUY",
        "EGINTV", "EHINPS", "ELPSTU", "GILRUW",
    ])

    return Array.from({ length: gridSize * gridSize }, (_, index) =>
        pick(rng, dice[index % dice.length].split("")).toLowerCase()
    )
}

export const generateClusters = (seed: string, gridSize: number, vowelness = 0.46): string[] => {
    const rng = seedrandom(seed)

    const clusters: Record<string, string[]> = {
        b: ["r", "l"],
        c: ["r", "l", "h", "k"],
        d: ["r", "w", "g"],
        f: ["r", "l"],
        g: ["r", "l", "h", "w", "n"],
        h: ["s", "c"],
        k: ["r", "l", "n", "c"],
        n: ["g"],
        p: ["r", "l", "h", "n"],
        s: ["c", "k", "l", "m", "n", "p", "t", "w", "h"],
        t: ["r", "h", "w", "s"],
        v: ["r"],
        w: ["h", "r"],
        y: ["m"],
    }

    const qualityLetterPool = ["s", "t", "e", "r", "a"]

    const board = Array.from({ length: gridSize * gridSize }, (_, i) => {
        if ([5, 6, 9, 10].includes(i) && rng() > 0.7) {
            return pick(rng, qualityLetterPool)
        }

        return rng() > vowelness ? pick(rng, vowelPool) : pick(rng, consonantPool)
    })

    for (let i = 0; i < board.length; i++) {
        const cluster = clusters[board[i]]

        if (cluster) {
            const letter = pick(rng, cluster)
            board[pick(rng, getAdjacentPositions(i, gridSize))] = letter
        }
    }

    for (let i = 0; i < board.length; i++) {
        if (!isVowel(board[i]) && !getAdjacentPositions(i, gridSize).some((x) => isVowel(board[x]))) {
            board[i] = pick(rng, vowelPool)
        }
    }

    const crowded = board.flatMap((letter, i) =>
        getAdjacentPositions(i, gridSize).filter((pos) => board[pos] === letter).length > 1 ? [i] : []
    )

    for (const pos of crowded) {
        board[pos] = isVowel(board[pos]) ? pick(rng, consonantPool) : pick(rng, vowelPool)
    }

    return board
}

// places a random 9-11 letter word along an adjacent path, then fills the rest so that vowels
// and consonants pull towards each other and no letter appears in a bad double or any triple.
// requires the dictionary to be loaded first
export const generateWithWord = (seed: string, gridSize: number): string[] => {
    const rng = seedrandom(seed)

    const seedWord = pick(
        rng,
        dictionaryManager.list.filter((word) => word.length > 8 && word.length < 12)
    )

    const board = Array.from({ length: gridSize * gridSize }, () => "")

    const chebyshevDistance = (a: number, b: number) =>
        Math.max(
            Math.abs((a % gridSize) - (b % gridSize)),
            Math.abs(Math.floor(a / gridSize) - Math.floor(b / gridSize))
        )

    const neighborsWith = (position: number, letter: string) =>
        getAdjacentPositions(position, gridSize).filter((index) => board[index] === letter)

    // aa, ii, uu and these consonant pairs read badly; oo and ee are common enough to encourage
    const createsBadDouble = (candidate: number, letter: string) =>
        "auiqwyhkxcv".includes(letter) && neighborsWith(candidate, letter).length > 0

    const createsTriple = (candidate: number, letter: string) => {
        const same = neighborsWith(candidate, letter)

        return (
            same.length >= 2 ||
            same.some((neighbor) =>
                neighborsWith(neighbor, letter).some((index) => index !== candidate)
            )
        )
    }

    const isAllowed = (candidate: number, letter: string) =>
        !createsBadDouble(candidate, letter) && !createsTriple(candidate, letter)

    const scoreCandidate = (candidate: number, letter: string) => {
        const vowel = isVowel(letter)
        const opposite = board.flatMap((tile, index) =>
            tile !== "" && isVowel(tile) !== vowel ? [index] : []
        )

        const averageDistance =
            opposite.length === 0
                ? 0
                : opposite.reduce((sum, index) => sum + chebyshevDistance(candidate, index), 0) /
                  opposite.length

        const doubleBonus = "oe".includes(letter) && neighborsWith(candidate, letter).length > 0 ? 2 : 0

        return doubleBonus - averageDistance
    }

    const rankedBy = <T,>(items: T[], score: (item: T) => number) =>
        shuffle(rng, [...items]).sort((a, b) => score(b) - score(a))

    const tryPlace = (letterIndex: number, position: number): boolean => {
        board[position] = seedWord[letterIndex]

        if (letterIndex === seedWord.length - 1) {
            return true
        }

        const nextLetter = seedWord[letterIndex + 1]

        const candidates = rankedBy(
            getAdjacentPositions(position, gridSize).filter(
                (candidate) => board[candidate] === "" && isAllowed(candidate, nextLetter)
            ),
            (candidate) => scoreCandidate(candidate, nextLetter)
        )

        if (candidates.some((candidate) => tryPlace(letterIndex + 1, candidate))) {
            return true
        }

        board[position] = ""
        return false
    }

    shuffle(rng, Array.from({ length: board.length }, (_, i) => i)).some((start) => tryPlace(0, start))

    const filledNeighbors = (cell: number) =>
        getAdjacentPositions(cell, gridSize).filter((index) => board[index] !== "").length

    const emptyCells = board.flatMap((tile, index) => (tile === "" ? [index] : []))

    while (emptyCells.length > 0) {
        emptyCells.sort((a, b) => filledNeighbors(b) - filledNeighbors(a))
        const cell = emptyCells.shift()!

        const ranked = rankedBy(rng() < 0.46 ? "aeiou".split("") : consonantPool, (letter) =>
            scoreCandidate(cell, letter)
        )

        board[cell] = ranked.find((letter) => isAllowed(cell, letter)) ?? ranked[0]
    }

    return removeDeadLetters(rng, board, gridSize)
}

const removeDeadLetters = (rng: Rng, board: string[], gridSize: number): string[] => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("")

    for (let attempt = 0; attempt < 20; attempt++) {
        const usedLetters = new Set([...solve(board, gridSize)].join(""))
        const dead = board.flatMap((letter, index) => (usedLetters.has(letter) ? [] : [index]))

        if (dead.length === 0) {
            break
        }

        for (const index of dead) {
            board[index] = pick(rng, alphabet)
        }
    }

    return board
}
