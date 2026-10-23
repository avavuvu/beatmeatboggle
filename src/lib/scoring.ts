import { dirtyWords } from "./dictionary/dirtyWords"

export type ScoreItem = {
    points: number
    reason:
        | "length"
        | "dirty bonus"
        | "unique"
        | "opponent bonus"
        | "hidden word bonus"
        | "rare letter bonus"
}

export type WordScore = {
    points: number
    breakdown: ScoreItem[]
}

export type BoardContext = {
    seedWord: string | null
    boardDate: string | null
}

export type Match = BoardContext & {
    opponentWords: string[] | null
    fairFight: boolean
}

type Bonus = {
    reason: "unique" | "opponent bonus"
    otherWords: Set<string>
} | null

export const HIDDEN_WORD_AND_RARE_LETTER_BONUSES_SINCE = "2026-10-24"

const HIDDEN_WORD_POINTS = 4
const RARE_LETTER_POINTS = 1
const RARE_LETTERS = /[qjxz]/

const newBonusesApply = (boardDate: string | null) =>
    boardDate === null || boardDate >= HIDDEN_WORD_AND_RARE_LETTER_BONUSES_SINCE

export const wordLengthToPoints = (word: string) =>
    Math.floor(Math.pow(word.length, 2) / 4)

const scoreWithBonus = ({
    word,
    bonus,
    board,
}: {
    word: string
    bonus: Bonus
    board: BoardContext
}): WordScore => {
    const breakdown: ScoreItem[] = [
        { points: wordLengthToPoints(word), reason: "length" },
    ]

    if (bonus && !bonus.otherWords.has(word)) {
        breakdown.push({ points: 1, reason: bonus.reason })
    }

    if (newBonusesApply(board.boardDate)) {
        if (word === board.seedWord) {
            breakdown.push({
                points: HIDDEN_WORD_POINTS,
                reason: "hidden word bonus",
            })
        }

        if (RARE_LETTERS.test(word)) {
            breakdown.push({
                points: RARE_LETTER_POINTS,
                reason: "rare letter bonus",
            })
        }
    }

    if (dirtyWords.has(word)) {
        breakdown.push({ points: 4, reason: "dirty bonus" })
    }

    return {
        points: breakdown.reduce((total, item) => total + item.points, 0),
        breakdown,
    }
}

const totalWithBonus = ({
    words,
    bonus,
    board,
}: {
    words: string[]
    bonus: Bonus
    board: BoardContext
}) =>
    words.reduce(
        (total, word) => total + scoreWithBonus({ word, bonus, board }).points,
        0
    )

const playerBonus = ({ opponentWords, fairFight }: Match): Bonus =>
    opponentWords
        ? {
              reason: fairFight ? "unique" : "opponent bonus",
              otherWords: new Set(opponentWords),
          }
        : null

export const scoreWord = ({ word, match }: { word: string; match: Match }) =>
    scoreWithBonus({ word, bonus: playerBonus(match), board: match })

export const scorePlayer = ({
    words,
    match,
}: {
    words: string[]
    match: Match
}) => totalWithBonus({ words, bonus: playerBonus(match), board: match })

export const scoreOpponent = ({
    playerWords,
    match,
}: {
    playerWords: string[]
    match: Match
}) =>
    totalWithBonus({
        words: match.opponentWords ?? [],
        bonus: match.fairFight
            ? { reason: "unique", otherWords: new Set(playerWords) }
            : null,
        board: match,
    })

export const scoreSolo = ({
    words,
    board,
}: {
    words: string[]
    board: BoardContext
}) => totalWithBonus({ words, bonus: null, board })
