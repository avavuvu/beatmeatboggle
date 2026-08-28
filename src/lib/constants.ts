import type { BoardSettings } from "./boardSettings"

export type PlayerState = "ava" | "player"

export const RESULT_KEY_PREFIX = "result_"
export const SCORE_KEY_PREFIX = "scores_"
export const GAME_KEY_PREFIX = "boggle_"
export const PLAYER_ID_KEY = "playerId"

export const toISODateKey = (date: Date): string =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`

export const getAdjacentPositions = (index: number, gridSize: number) => {
    const x = index % gridSize

    const validKeys = [index + gridSize, index - gridSize]

    if (x !== 0) {
        validKeys.push(index - 1)
        validKeys.push(index - gridSize - 1)
        validKeys.push(index + gridSize - 1)
    }
    if (x + 1 < gridSize) {
        validKeys.push(index + 1)
        validKeys.push(index - gridSize + 1)
        validKeys.push(index + gridSize + 1)
    }

    return validKeys.filter((key) => key >= 0 && key < gridSize * gridSize)
}

export const description =
    "Every day I play a game of Boggle. Every day you try and beat my score."
export const title = "Beat Me At Boggle"

export const siteUrl = "https://beatmeatboggle.com"

export const dateOverrides: Record<string, BoardSettings> = {
    "2026-04-20": {
        size: 4,
        letters: "hapybdayriasingh".split(""),
        time: 3 * 60,
    },
    "2026-08-24": {
        size: 4,
        letters: "eefisrtatkshcaco".split(""),
        time: 3 * 60,
    },
    "2026-08-25": {
        size: 4,
        letters: "eyaoegebntesihom".split(""),
        time: 3 * 60,
    },
    "2026-08-26": {
        size: 4,
        letters: "tronoshoeiptsema".split(""),
        time: 3 * 60,
    },
    "2026-08-27": {
        size: 4,
        letters: "cshuehsoeboaodri".split(""),
        time: 3 * 60,
    },
    "2026-08-29": {
        size: 5,
        letters: "ireaistesueztwhgarinlmooa".split(""),
        time: 4 * 60,
    },
    "2026-08-30": {
        size: 5,
        letters: "oneeolaistvngrhoaitoxleeo".split(""),
        time: 4 * 60,
    },
}
