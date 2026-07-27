import { toISODateKey, type PlayerState } from "./constants"
import { getBoardSettings, rerollBoard, type BoardSettings } from "./boardSettings"
import { solve } from "./dictionary/solver"
import { getPlayerId } from "$lib/session"

export type GameSession = {
    board: BoardSettings
    dateKey: string
    playerState: PlayerState
    totalPossibleWords: string[]
    playerId: string | null
    challengedBy: string | null
}

export const createGameSession = (
    date: Date,
    playerState: PlayerState,
    totalWords: string[] | null,
    challengedBy: string | null = null
): GameSession => {
    let board = getBoardSettings(date)

    const initialWords = [...solve(board.letters, board.size)]
    if (initialWords.length < 130) {
        board = rerollBoard(date)
    }

    const totalPossibleWords = totalWords ?? [...solve(board.letters, board.size)]

    return {
        board,
        dateKey: toISODateKey(date),
        playerState,
        totalPossibleWords,
        playerId: getPlayerId(),
        challengedBy,
    }
}
