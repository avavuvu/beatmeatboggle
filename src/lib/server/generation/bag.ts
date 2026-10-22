import { getAdjacentPositions } from "../../constants"
import { solve } from "../../dictionary/solver"
import { pick, shuffle, weightedPick, type Rng } from "./rng"
import { CONSONANT_CAP, CONSONANT_WEIGHTS, VOWEL_CAPS, VOWEL_TARGETS, VOWEL_WEIGHTS, isVowel } from "./letters"

export const bagFill = (rng: Rng, board: string[], size: number, locked: Set<number> = new Set()) => {
    const counts: Record<string, number> = {}
    for (const l of board) if (l) counts[l] = (counts[l] ?? 0) + 1
    const rareOnBoard = () => board.filter((l) => "jqxz".includes(l)).length

    const vowelTarget = pick(rng, VOWEL_TARGETS[size])
    const placedVowels = board.filter(isVowel).length
    const empty = shuffle(
        rng,
        board.flatMap((l, i) => (l === "" ? [i] : []))
    )
    let vowelsToPlace = Math.max(0, Math.min(empty.length, vowelTarget - placedVowels))

    const draw = (cell: number, vowel: boolean) => {
        for (let attempt = 0; attempt < 12; attempt++) {
            const letter = weightedPick(rng, vowel ? VOWEL_WEIGHTS : CONSONANT_WEIGHTS)
            const cap = vowel ? VOWEL_CAPS[letter] : CONSONANT_CAP
            if ((counts[letter] ?? 0) >= cap) continue
            if ("jqxz".includes(letter) && rareOnBoard() >= 1) continue
            if (vowel && getAdjacentPositions(cell, size).some((a) => board[a] === letter)) continue
            return letter
        }
        return vowel ? "e" : "t"
    }

    const set = (cell: number, letter: string) => {
        if (board[cell]) counts[board[cell]]--
        board[cell] = letter
        counts[letter] = (counts[letter] ?? 0) + 1
    }

    for (const cell of empty) {
        const vowel = vowelsToPlace > 0
        if (vowel) vowelsToPlace--
        set(cell, draw(cell, vowel))
    }

    for (let attempt = 0; attempt < 10; attempt++) {
        const used = new Set([...solve(board, size)].join(""))
        const dead = board.flatMap((letter, index) => (used.has(letter) || locked.has(index) ? [] : [index]))
        if (dead.length === 0) break
        for (const index of dead) set(index, draw(index, isVowel(board[index])))
    }

    return board
}

export const constructBag = (rng: Rng, size: number): string[] =>
    bagFill(rng, Array.from({ length: size * size }, () => ""), size)

const spreadWalk = (rng: Rng, word: string, size: number): number[] | null => {
    const n = size * size
    let best: number[] | null = null
    let bestSpread = -1

    for (let attempt = 0; attempt < 8; attempt++) {
        const path: number[] = []
        const used = new Array<boolean>(n).fill(false)
        const dfs = (i: number): boolean => {
            if (i === word.length) return true
            const cands =
                i === 0 ? shuffle(rng, [...Array(n).keys()]) : shuffle(rng, getAdjacentPositions(path[i - 1], size))
            for (const p of cands) {
                if (used[p]) continue
                used[p] = true
                path.push(p)
                if (dfs(i + 1)) return true
                path.pop()
                used[p] = false
            }
            return false
        }
        if (!dfs(0)) continue
        const rows = new Set(path.map((p) => Math.floor(p / size))).size
        const cols = new Set(path.map((p) => p % size)).size
        if (rows + cols > bestSpread) {
            bestSpread = rows + cols
            best = [...path]
        }
    }
    return best
}

export const constructSpread = (rng: Rng, size: number, chosen: string): string[] | null => {
    const seedWord = chosen.replace("qu", "q")
    const board = Array.from({ length: size * size }, () => "")

    const path = spreadWalk(rng, seedWord, size)
    if (!path) return null
    path.forEach((p, i) => (board[p] = seedWord[i]))

    return bagFill(rng, board, size, new Set(path))
}
