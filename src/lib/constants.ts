export const RESULT_KEY_PREFIX = "result_"
export const SCORE_KEY_PREFIX = "scores_"
export const GAME_KEY_PREFIX = "boggle_"

/** Format a Date as a YYYY-MM-DD key using local time. */
export const toISODateKey = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

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

export const dateOverrides: Record<
    string,
    {
        size: number
        board: string[]
        time: number
    }
> = {
    "2026-04-20": {
        size: 4,
        board: "hapybdayriasingh".split(""),
        time: 3 * 60,
    },
}
