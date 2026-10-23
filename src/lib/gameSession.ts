import type { PlayerState } from "./constants"
import type { BoardSettings, ResolvedBoard } from "./board"
import type { Match } from "./scoring"
import { isValidDateKey } from "./dates"
import { getPlayerId } from "$lib/session"
import preferences from "./Preferences.svelte"

export type GameSession = {
    board: BoardSettings
    seedWord: string | null
    dateKey: string
    saveKey: string
    playerState: PlayerState
    totalPossibleWords: string[]
    playerId: string | null
    challengedBy: string | null
    isArchive: boolean
    opponentName: string
    match: Match
}

export const createGameSession = ({
    dateKey,
    playerState,
    board: { size, letters, time, totalWords, seedWord = null },
    opponentWords,
    opponentName,
    challengedBy,
    isArchive = false,
}: {
    dateKey: string
    playerState: PlayerState
    board: ResolvedBoard
    opponentWords: string[] | null
    opponentName: string
    challengedBy: string | null
    isArchive?: boolean
}): GameSession => {
    const extraTime = preferences.settings.extraTime.value ? 2 * 60 : 0

    return {
        board: { size, letters, time: time + extraTime },
        seedWord,
        dateKey,
        saveKey: challengedBy
            ? `${dateKey}_challenge_${challengedBy}`
            : dateKey,
        playerState,
        totalPossibleWords: totalWords,
        playerId: getPlayerId(),
        challengedBy,
        isArchive,
        opponentName,
        match: {
            opponentWords,
            seedWord,
            boardDate: isValidDateKey(dateKey) ? dateKey : null,
            fairFight:
                challengedBy !== null || preferences.settings.fairFight.value,
        },
    }
}
