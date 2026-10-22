import type { PlayerState } from "./constants"
import type { BoardSettings, HiddenWord, ResolvedBoard } from "./board"
import { getPlayerId } from "$lib/session"
import preferences from "./Preferences.svelte"

export type GameSession = {
    board: BoardSettings
    hidden: HiddenWord
    dateKey: string
    playerState: PlayerState
    totalPossibleWords: string[]
    playerId: string | null
    challengedBy: string | null
}

export const createGameSession = (
    dateKey: string,
    playerState: PlayerState,
    { size, letters, time, totalWords, seedWord = null, ladder }: ResolvedBoard,
    challengedBy: string | null = null
): GameSession => {
    const extraTime = preferences.settings.extraTime.value ? 2 * 60 : 0

    return {
        board: { size, letters, time: time + extraTime },
        hidden: { seedWord, ladder: ladder ?? [] },
        dateKey,
        playerState,
        totalPossibleWords: totalWords,
        playerId: getPlayerId(),
        challengedBy,
    }
}
