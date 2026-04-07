import { getAdjacentPositions } from "./constants";
import seedrandom from "seedrandom"

export const generateClassic = (seed: string, gridSize: number): string[] => {
    const rng = seedrandom(seed)
    const classicDice = [
        "AACIOT", "ABILTY", "ABJMOQ", "ACDEMP",
        "ACELRS", "ADENVZ", "AHMORS", "BIFORX",
        "DENOSW", "DKNOTU", "EEFHIY", "EGKLUY",
        "EGINTV", "EHINPS", "ELPSTU", "GILRUW",
    ]

    for (let i = classicDice.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [classicDice[i], classicDice[j]] = [classicDice[j], classicDice[i]];
    }


    return Array.from({ length: gridSize * gridSize }, (_, index) => {
        const die = classicDice[index % classicDice.length]

        return die[Math.floor(rng() * die.length)].toLowerCase()
    })

}

export const generateClusters = (seed: string, gridSize: number, vowelness = 0.46): string[] => {
    const rng = seedrandom(seed)

    const clusters: Record<string, string[]> = {
        "b": ["r", "l"],
        "c": ["r", "l", "h", "k"],
        "d": ["r", "w", "g"],
        "f": ["r", "l"],
        "g": ["r", "l", "h", "w", "n"],
        "h": ["s", "c",],
        // "j": [],
        "k": ["r", "l", "n", "c"],
        // "l": [],
        // "m": [],
        "n": ["g"],
        "p": ["r", "l", "h", "n"],
        // "r": [],
        "s": ["c", "k", "l", "m", "n", "p", "t", "w", "h"],
        "t": ["r", "h", "w", "s"],
        "v": ["r"],
        "w": ["h", "r"],
        // "x": [],
        "y": ["m"],
        // "z": [],
    }

    const vowelPool = ["e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "a", "a", "a", "a", "a", "a", "i", "i", "i", "i", "i", "i", "o", "o", "o", "o", "o", "o", "o", "u", "u", "u"]

    const consonantPool = ["l", "l", "l", "l", "n", "n", "n", "n", "n", "n", "s", "s", "s", "s", "s", "s", "t", "t", "t", "t", "t", "t", "t", "t", "t", "d", "d", "d", "r", "r", "r", "r", "r", "b", "b", "c", "c", "g", "g", "h", "h", "h", "h", "h", "m", "m", "p", "p", "y", "y", "y", "f", "f", "k", "v", "v", "w", "w", "w", "j", "q", "x", "z"]

    const qualityLetterPool = ["s", "t", "e", "r", "a"]

    const randomVowel = () => vowelPool[Math.floor(rng() * vowelPool.length)]
    const randomConsonant = () => consonantPool[Math.floor(rng() * consonantPool.length)]
    const randomQualityLetter = () => qualityLetterPool[Math.floor(rng() * qualityLetterPool.length)]

    const board = Array.from({ length: gridSize * gridSize }, (_, i) => {
        if ([5, 6, 9, 10].includes(i) && rng() > 0.7) {
            return randomQualityLetter()
        }

        if (rng() > vowelness) {
            return randomVowel()
        }
        return randomConsonant()
    })

    for (let i = 0; i < gridSize * gridSize; i++) {
        const letter = board[i]
        if (Object.keys(clusters).includes(letter)) {
            const positions = getAdjacentPositions(i, gridSize)
            const cluster = clusters[letter][Math.floor(rng() * clusters[letter].length)]

            board[positions[Math.floor(rng() * positions.length)]] = cluster
        }
    }

    for (let i = 0; i < gridSize * gridSize; i++) {
        const letter = board[i]
        if (consonantPool.includes(letter)) {
            const positions = getAdjacentPositions(i, gridSize)

            if (!positions.some(x => vowelPool.includes(board[x]))) {
                board[i] = randomVowel()
            }
        }
    }

    let change = []

    for (let i = 0; i < gridSize * gridSize; i++) {
        const letter = board[i]

        const positions = getAdjacentPositions(i, gridSize)

        let count = 0
        for (const pos of positions) {
            if (board[pos] === letter) {
                count++
            }
        }

        if (count > 1) {
            change.push(i)
        }
    }

    for (const pos of change) {
        if (vowelPool.includes(board[pos])) {
            board[pos] = randomConsonant()
        } else {
            board[pos] = randomVowel()
        }
    }

    return board
}

export const generateClaude = (seed: string, gridSize: number): string[] => {
    const rng = seedrandom(seed)

    const size = gridSize * gridSize
    const board = Array(size).fill('')

    // Vowels: heavy E and A bias — they unlock the most suffix patterns
    const vowelPool = [
        'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e',
        'a', 'a', 'a', 'a', 'a',
        'o', 'o', 'o', 'o',
        'i', 'i', 'i', 'i',
        'u',
    ]

    // Consonants: S and T heavily weighted (plurals, -ST, -ED, -EST)
    // R, N, L are the next tier (-ER, -ING, -AL, -AN)
    // H included for TH / SH / WH
    const consonantPool = [
        's', 's', 's', 's', 's',
        't', 't', 't', 't',
        'r', 'r', 'r', 'r',
        'n', 'n', 'n', 'n',
        'l', 'l', 'l',
        'd', 'd', 'd',
        'h', 'h', 'h',
        'c', 'c',
        'g', 'g',
        'm', 'm',
        'p', 'p',
        'b', 'b',
        'f', 'f',
        'w', 'w',
        'k',
        'y', 'y',
        'v',
    ]

    const pick = (pool: string[]) => pool[Math.floor(rng() * pool.length)]

    // Sort all positions by neighbour count descending.
    // For a 4×4: inner tiles have 8, edge tiles 5, corners 3.
    const byConnectivity = Array.from({ length: size }, (_, i) => i)
        .sort((a, b) => getAdjacentPositions(b, gridSize).length - getAdjacentPositions(a, gridSize).length)

    // ~38% vowels — sits in the sweet spot from the data (50% default wins but 40–60% all cluster together)
    const vowelCount = Math.round(size * 0.38)
    const vowelPositions = new Set(byConnectivity.slice(0, vowelCount))

    // Initial fill
    for (let i = 0; i < size; i++) {
        board[i] = vowelPositions.has(i) ? pick(vowelPool) : pick(consonantPool)
    }

    // Guarantee E in the single most-connected position.
    board[byConnectivity[0]] = 'e'

    // Guarantee S in the most-connected consonant position.
    const topConsonantPos = byConnectivity.find(p => !vowelPositions.has(p))!
    board[topConsonantPos] = 's'

    // Suffix adjacency seeding — try to place NG and TH pairs.
    // For each N on the board, nudge a neighbour toward G.
    // For each T on the board, nudge a neighbour toward H.
    const tryNudge = (letter: string, partner: string) => {
        for (let i = 0; i < size; i++) {
            if (board[i] !== letter) continue
            const neighbours = getAdjacentPositions(i, gridSize).filter(p => !vowelPositions.has(p))
            if (neighbours.length === 0) continue
            // Only place if the neighbour is a low-value letter (not S, T, R, N, L)
            const lowValue = new Set(['b', 'c', 'f', 'g', 'k', 'm', 'p', 'v', 'w', 'x', 'y', 'z'])
            const target = neighbours.find(p => lowValue.has(board[p]))
            if (target !== undefined) {
                board[target] = partner
            }
        }
    }

    tryNudge('n', 'g')   // → -ING, -ANG, -ONG
    tryNudge('t', 'h')   // → TH-, -TH

    // Safety: any consonant with zero vowel neighbours → replace with vowel
    const vowelSet = new Set(vowelPool)
    for (let i = 0; i < size; i++) {
        if (vowelSet.has(board[i])) continue
        const hasVowelNeighbour = getAdjacentPositions(i, gridSize).some(p => vowelSet.has(board[p]))
        if (!hasVowelNeighbour) {
            board[i] = pick(vowelPool)
        }
    }

    return board
}