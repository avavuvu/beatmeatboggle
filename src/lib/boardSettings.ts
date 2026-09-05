import { dateOverrides, toISODateKey } from "$lib/constants"
import { generateClassic, generateClusters } from "$lib/generateBoard"
// import preferences from "$lib/Preferences.svelte"

export const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const

type Weekday = (typeof WEEKDAYS)[number]
type GenerationSettings = {
    size: number
    generateBoard: (seed: string, gridSize: number, ...args: any[]) => string[]
    time: number
}

/** **Static** properties of game's board */
export type BoardSettings = {
    size: number
    letters: string[]
    time: number
}

const threeMinutes = 3 * 60
const fourMinutes = 4 * 60

export const weekDayMap: Record<Weekday, GenerationSettings> = {
    Monday: {
        size: 4,
        generateBoard: generateClassic,
        time: threeMinutes,
    },
    Tuesday: {
        size: 4,
        generateBoard: generateClassic,
        time: threeMinutes,
    },
    Wednesday: {
        size: 4,
        generateBoard: generateClusters,
        time: threeMinutes,
    },
    Thursday: {
        size: 4,
        generateBoard: generateClusters,
        time: threeMinutes,
    },
    Friday: {
        size: 4,
        generateBoard: generateClusters,
        time: threeMinutes,
    },
    Saturday: {
        size: 5,
        generateBoard: generateClusters,
        time: fourMinutes,
    },
    Sunday: {
        size: 5,
        generateBoard: generateClusters,
        time: fourMinutes,
    },
}

export const getBoardSettings = (date: Date): BoardSettings => {
    const dateKey = toISODateKey(date)
    const weekday = WEEKDAYS[date.getUTCDay()]

    const override: BoardSettings | undefined = dateOverrides[dateKey]
    const todaysGeneration = weekDayMap[weekday]

    const boardSettings = override ?? {
        size: todaysGeneration.size,
        letters: todaysGeneration.generateBoard(dateKey, todaysGeneration.size),
        time: todaysGeneration.time,
    }

    const extraTime = preferences.settings.extraTime.value ? 2 * 60 : 0

    boardSettings.time += extraTime

    return boardSettings
}

/** This will be changed in a future version so the board is retrieved from a central location
 * rather than genreated by each users' client
 * but we need it for now :/
 */
export const rerollBoard = (date: Date): BoardSettings => {
    const dateKey = toISODateKey(date)
    const weekday = WEEKDAYS[date.getUTCDay()]

    const todaysGeneration = weekDayMap[weekday]

    const board = getBoardSettings(date)

    return {
        ...board,
        letters: todaysGeneration.generateBoard(
            `${dateKey}-reroll`,
            todaysGeneration.size
        ),
    }
}
