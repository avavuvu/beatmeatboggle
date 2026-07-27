import { browser } from "$app/environment"
import { PLAYER_ID_KEY } from "$lib/constants"

export * from "./gameState"

export const generatePlayerId = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export const getPlayerId = (): string | null => {
    if (!browser) return null

    const id = localStorage.getItem(PLAYER_ID_KEY)

    if (id) {
        return id
    }

    const newId = generatePlayerId()
    localStorage.setItem(PLAYER_ID_KEY, newId)

    return newId

}
