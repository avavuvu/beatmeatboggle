import { browser } from "$app/environment"
import { GAME_KEY_PREFIX } from "$lib/constants"

export type SavedGameState = {
    foundWords: string[]
    secondsLeft: number
    gameOver: boolean
    average?: number
}

export const saveGameState = (dateKey: string, state: SavedGameState): void => {
    if (!browser) return

    localStorage.setItem(`${GAME_KEY_PREFIX}${dateKey}`, JSON.stringify(state))
}

export const loadGameState = (dateKey: string): SavedGameState | null => {
    if (!browser) return null

    const saved = localStorage.getItem(`${GAME_KEY_PREFIX}${dateKey}`)
    if (!saved) return null

    return JSON.parse(saved)
}
