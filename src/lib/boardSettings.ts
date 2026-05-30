import { dateOverrides, toISODateKey } from "$lib/constants"
import { generateClassic, generateClusters } from "$lib/generateBoard"
import preferences from "$lib/Preferences.svelte"

const WEEKDAYS = [
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

const weekDayMap: Record<Weekday, GenerationSettings> = {
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
    const weekday = WEEKDAYS[date.getDay()]

    const override: BoardSettings | undefined = dateOverrides[dateKey]
    const todaysGeneration = weekDayMap[weekday]

    const boardSettings = override ?? {
        size: todaysGeneration.size,
        letters: todaysGeneration.generateBoard(dateKey, todaysGeneration.size),
        time: todaysGeneration.time,
    }

    const extraTime = preferences.settings.extraTime.value ? 2 * 60 : 0
    boardSettings.time + extraTime

    return boardSettings
}
