import { getAdjacentPositions } from "../../../src/lib/constants"
import { isVowel, usedLetters } from "../solver"
import { pick, shuffle, weightedPick, type Rng } from "../rng"
import { CONSONANT_CAP, CONSONANT_WEIGHTS, VOWEL_CAPS, VOWEL_TARGETS, VOWEL_WEIGHTS } from "./letters"

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
        const used = usedLetters(board, size)
        const dead = board.flatMap((letter, index) => (used.has(letter) || locked.has(index) ? [] : [index]))
        if (dead.length === 0) break
        for (const index of dead) set(index, draw(index, isVowel(board[index])))
    }

    return board
}

export const constructBag = (rng: Rng, size: number): string[] =>
    bagFill(rng, Array.from({ length: size * size }, () => ""), size)
