import { getAdjacentPositions } from "./constants"
import seedrandom from "seedrandom"
import wordList from "$lib/dictionary/wordList.txt"
import { solve } from "$lib/dictionary/solver"

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("")

const removeDeadLetters = (board: string[], gridSize: number, rng: () => number): string[] => {
    for (let attempt = 0; attempt < 20; attempt++) {
        const usedLetters = new Set([...solve(board, gridSize)].join("").split(""))

        const deadIndices = board.reduce<number[]>((acc, letter, index) => {
            if (!usedLetters.has(letter)) {
                acc.push(index)
            }
            return acc
        }, [])

        if (deadIndices.length === 0) {
            break
        }

        for (const index of deadIndices) {
            board[index] = ALPHABET[Math.floor(rng() * ALPHABET.length)]
        }
    }

    return board
}

export const generateClassic = (seed: string, gridSize: number): string[] => {
    const rng = seedrandom(seed)
    const classicDice = [
        "AACIOT",
        "ABILTY",
        "ABJMOQ",
        "ACDEMP",
        "ACELRS",
        "ADENVZ",
        "AHMORS",
        "BIFORX",
        "DENOSW",
        "DKNOTU",
        "EEFHIY",
        "EGKLUY",
        "EGINTV",
        "EHINPS",
        "ELPSTU",
        "GILRUW",
    ]

    for (let i = classicDice.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[classicDice[i], classicDice[j]] = [classicDice[j], classicDice[i]]
    }

    const board = Array.from({ length: gridSize * gridSize }, (_, index) => {
        const die = classicDice[index % classicDice.length]

        return die[Math.floor(rng() * die.length)].toLowerCase()
    })

    return removeDeadLetters(board, gridSize, rng)
}

export const generateClusters = (
    seed: string,
    gridSize: number,
    vowelness = 0.46
): string[] => {
    const rng = seedrandom(seed)

    const clusters: Record<string, string[]> = {
        b: ["r", "l"],
        c: ["r", "l", "h", "k"],
        d: ["r", "w", "g"],
        f: ["r", "l"],
        g: ["r", "l", "h", "w", "n"],
        h: ["s", "c"],
        // "j": [],
        k: ["r", "l", "n", "c"],
        // "l": [],
        // "m": [],
        n: ["g"],
        p: ["r", "l", "h", "n"],
        // "r": [],
        s: ["c", "k", "l", "m", "n", "p", "t", "w", "h"],
        t: ["r", "h", "w", "s"],
        v: ["r"],
        w: ["h", "r"],
        // "x": [],
        y: ["m"],
        // "z": [],
    }

    const vowelPool = [
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
        "a",
        "a",
        "a",
        "a",
        "a",
        "a",
        "i",
        "i",
        "i",
        "i",
        "i",
        "i",
        "o",
        "o",
        "o",
        "o",
        "o",
        "o",
        "o",
        "u",
        "u",
        "u",
    ]

    const consonantPool = [
        "l",
        "l",
        "l",
        "l",
        "n",
        "n",
        "n",
        "n",
        "n",
        "n",
        "s",
        "s",
        "s",
        "s",
        "s",
        "s",
        "t",
        "t",
        "t",
        "t",
        "t",
        "t",
        "t",
        "t",
        "t",
        "d",
        "d",
        "d",
        "r",
        "r",
        "r",
        "r",
        "r",
        "b",
        "b",
        "c",
        "c",
        "g",
        "g",
        "h",
        "h",
        "h",
        "h",
        "h",
        "m",
        "m",
        "p",
        "p",
        "y",
        "y",
        "y",
        "f",
        "f",
        "k",
        "v",
        "v",
        "w",
        "w",
        "w",
        "j",
        "q",
        "x",
        "z",
    ]

    const qualityLetterPool = ["s", "t", "e", "r", "a"]

    const randomVowel = () => vowelPool[Math.floor(rng() * vowelPool.length)]
    const randomConsonant = () =>
        consonantPool[Math.floor(rng() * consonantPool.length)]
    const randomQualityLetter = () =>
        qualityLetterPool[Math.floor(rng() * qualityLetterPool.length)]

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
            const cluster =
                clusters[letter][Math.floor(rng() * clusters[letter].length)]

            board[positions[Math.floor(rng() * positions.length)]] = cluster
        }
    }

    for (let i = 0; i < gridSize * gridSize; i++) {
        const letter = board[i]
        if (consonantPool.includes(letter)) {
            const positions = getAdjacentPositions(i, gridSize)

            if (!positions.some((x) => vowelPool.includes(board[x]))) {
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

    return removeDeadLetters(board, gridSize, rng)
}

const words = wordList.split("\n")

const generateWithWord = (
    seed: string,
    gridSize: number,
    debug = true,
) => {
    const rng = seedrandom(seed)

    const validWords = words.filter(words => words.length > 8 && words.length < 12)

    const seedWord = validWords[Math.floor(rng() * validWords.length)]

    if (debug) {
        console.log("seed word", seedWord)
    }

    const board = Array.from({ length: gridSize * gridSize }, () => "")

    const shuffle = <T,>(arr: T[]): T[] => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }

    const isVowel = (letter: string) => "aeiou".includes(letter)

    const chebyshevDistance = (a: number, b: number) => {
        const ax = a % gridSize
        const ay = Math.floor(a / gridSize)
        const bx = b % gridSize
        const by = Math.floor(b / gridSize)
        return Math.max(Math.abs(ax - bx), Math.abs(ay - by))
    }

    const vowelDoubleBonus: Record<string, number> = {
        o: 2,
        e: 2,
    }

    const badDoubleLetters = new Set([
        "a", "u", "i",
        "q", "w", "y", "h", "k", "x", "c", "v",
    ])

    const createsBadDouble = (candidate: number, letter: string) =>
        badDoubleLetters.has(letter) &&
        getAdjacentPositions(candidate, gridSize).some((index) => board[index] === letter)

    const createsTriple = (candidate: number, letter: string) => {
        const sameLetterNeighbors = getAdjacentPositions(candidate, gridSize).filter(
            (index) => board[index] === letter
        )

        if (sameLetterNeighbors.length >= 2) {
            return true
        }

        return sameLetterNeighbors.some((neighbor) =>
            getAdjacentPositions(neighbor, gridSize).some(
                (index) => index !== candidate && board[index] === letter
            )
        )
    }

    const scoreCandidate = (candidate: number, letter: string) => {
        const vowel = isVowel(letter)
        const opposite = board.reduce<number[]>((acc, tile, index) => {
            if (tile !== "" && isVowel(tile) !== vowel) {
                acc.push(index)
            }
            return acc
        }, [])

        const averageDistance =
            opposite.length === 0
                ? 0
                : opposite.reduce((sum, index) => sum + chebyshevDistance(candidate, index), 0) /
                  opposite.length

        let score = -averageDistance

        if (vowel) {
            const doubled = getAdjacentPositions(candidate, gridSize).some(
                (index) => board[index] === letter
            )

            if (doubled) {
                score += vowelDoubleBonus[letter] ?? 0
            }
        }

        return score
    }

    const debugDisplay = (label: string, letter: string, position: number) => {
        const vowel = isVowel(letter)
        let job = vowel
            ? "vowel, pulling close to consonants"
            : "consonant, pulling close to vowels"

        if (vowel) {
            const doubled = getAdjacentPositions(position, gridSize).some(
                (index) => board[index] === letter
            )

            if (doubled) {
                job += ", good double"
            }
        }

        console.log(`${label}: "${letter}" at ${position} - ${job}`)

        let display = ""
        for (let i = 0; i < board.length; i++) {
            const tile = (board[i] || ".").toUpperCase()
            display += i === position ? `[${tile}]` : ` ${tile} `

            if (i % gridSize === gridSize - 1) {
                console.log(display)
                display = ""
            }
        }
    }

    const tryPlace = (letterIndex: number, position: number): boolean => {
        board[position] = seedWord[letterIndex]

        if (debug) {
            debugDisplay(`step ${letterIndex}`, seedWord[letterIndex], position)
        }

        if (letterIndex === seedWord.length - 1) {
            return true
        }

        const nextLetter = seedWord[letterIndex + 1]

        const candidates = shuffle(
            getAdjacentPositions(position, gridSize).filter(
                (candidate) =>
                    board[candidate] === "" &&
                    !createsBadDouble(candidate, nextLetter) &&
                    !createsTriple(candidate, nextLetter)
            )
        ).sort(
            (a, b) => scoreCandidate(b, nextLetter) - scoreCandidate(a, nextLetter)
        )

        for (const candidate of candidates) {
            if (tryPlace(letterIndex + 1, candidate)) {
                return true
            }
        }

        board[position] = ""
        return false
    }

    const startPositions = shuffle(
        Array.from({ length: gridSize * gridSize }, (_, i) => i)
    )

    const placed = startPositions.some((start) => tryPlace(0, start))

    if (!placed && debug) {
        console.log("could not place seed word on board")
    }

    const vowelLetters = "aeiou".split("")
    const consonantLetters = [
        "l", "l", "l", "l",
        "n", "n", "n", "n", "n", "n",
        "s", "s", "s", "s", "s", "s",
        "t", "t", "t", "t", "t", "t", "t", "t", "t",
        "d", "d", "d",
        "r", "r", "r", "r", "r",
        "b", "b",
        "c", "c",
        "g", "g",
        "h", "h", "h", "h", "h",
        "m", "m",
        "p", "p",
        "y", "y", "y",
        "f", "f",
        "k",
        "v", "v",
        "w", "w", "w",
        "j",
        "q",
        "x",
        "z",
    ]
    const vowelChance = 0.46

    let emptyCells = board.reduce<number[]>((acc, tile, index) => {
        if (tile === "") {
            acc.push(index)
        }
        return acc
    }, [])

    while (emptyCells.length > 0) {
        emptyCells.sort((a, b) => {
            const filledA = getAdjacentPositions(a, gridSize).filter(
                (index) => board[index] !== ""
            ).length
            const filledB = getAdjacentPositions(b, gridSize).filter(
                (index) => board[index] !== ""
            ).length
            return filledB - filledA
        })

        const cell = emptyCells.shift()!

        const pool = rng() < vowelChance ? vowelLetters : consonantLetters

        const ranked = shuffle([...pool]).sort(
            (a, b) => scoreCandidate(cell, b) - scoreCandidate(cell, a)
        )

        const letter =
            ranked.find(
                (candidate) =>
                    !createsBadDouble(cell, candidate) && !createsTriple(cell, candidate)
            ) ?? ranked[0]

        board[cell] = letter

        if (debug) {
            debugDisplay("fill", letter, cell)
        }
    }

    removeDeadLetters(board, gridSize, rng)

    if (debug) {
        displayBoard(board, gridSize)
    }

    return { board, seedWord: placed ? seedWord : null }
}

const displayBoard = (board: string[], gridSize: number) => {
    let display = ""
    for (let i = 0; i < board.length; i++) {
        display += board[i] || "."

        if (i % gridSize === gridSize - 1) {
            console.log(display.toUpperCase())
            display = "";
        }
    }
}

const RARE_LETTERS = new Set(["q", "z", "x",])

const runSolve = (board: string[], gridSize: number, skipWord: string | null) => {
    const found = [...solve(board, gridSize)].filter((word) => word !== skipWord)

    const totalLength = found.reduce((sum, word) => sum + word.length, 0)
    const usedLetters = new Set(found.join("").split(""))

    return {
        uniqueWords: found.length,
        totalLength,
        rareLetters: board.filter((letter) => RARE_LETTERS.has(letter)).length,
        deadLetters: board.filter((letter) => !usedLetters.has(letter)).length,
    }
}

const summarize = (label: string, samples: ReturnType<typeof runSolve>[]) => {
    const totalWords = samples.reduce((sum, sample) => sum + sample.uniqueWords, 0)
    const totalLength = samples.reduce((sum, sample) => sum + sample.totalLength, 0)
    const totalRare = samples.reduce((sum, sample) => sum + sample.rareLetters, 0)
    const totalDead = samples.reduce((sum, sample) => sum + sample.deadLetters, 0)

    return {
        board: label,
        "avg unique words": totalWords / samples.length,
        "avg word length": totalWords === 0 ? 0 : totalLength / totalWords,
        "avg rare letters": totalRare / samples.length,
        "avg dead letters": totalDead / samples.length,
    }
}

export const testGeneration = (trials = 1000, gridSize = 5) => {
    const classicSamples = Array.from({ length: trials }, (_, i) =>
        runSolve(generateClassic(`classic-${i}`, gridSize), gridSize, null)
    )

    const clusterSamples = Array.from({ length: trials }, (_, i) =>
        runSolve(generateClusters(`clusters-${i}`, gridSize), gridSize, null)
    )

    const wordSamples = Array.from({ length: trials }, (_, i) => {
        const { board, seedWord } = generateWithWord(`withword-${i}`, gridSize, false)
        return runSolve(board, gridSize, seedWord)
    })

    const results = [
        summarize("classic", classicSamples),
        summarize("clusters", clusterSamples),
        summarize("withWord", wordSamples),
    ]

    console.table(results)

    return results
}

console.log(
    generateWithWord(`classic-4`, 4).board.join("")
)
