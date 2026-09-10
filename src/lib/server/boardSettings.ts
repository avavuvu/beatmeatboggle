import { toISODateKey } from "../constants"
import type { BoardSettings, ResolvedBoard } from "../board"
import { generateClassic, generateWithWord } from "./generateBoard"
import { solve } from "../dictionary/solver"

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
    generateBoard: (seed: string, gridSize: number) => string[]
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
        generateBoard: generateWithWord,
        time: threeMinutes,
    },
    Wednesday: {
        size: 4,
        generateBoard: generateWithWord,
        time: threeMinutes,
    },
    Thursday: {
        size: 4,
        generateBoard: generateWithWord,
        time: threeMinutes,
    },
    Friday: {
        size: 4,
        generateBoard: generateWithWord,
        time: threeMinutes,
    },
    Saturday: {
        size: 5,
        generateBoard: generateWithWord,
        time: fourMinutes,
    },
    Sunday: {
        size: 5,
        generateBoard: generateWithWord,
        time: fourMinutes,
    },
}

export const getBoardSettings = (date: Date): BoardSettings => {
    const dateKey = toISODateKey(date)
    const todaysGeneration = weekDayMap[WEEKDAYS[date.getUTCDay()]]

    return {
        size: todaysGeneration.size,
        letters: todaysGeneration.generateBoard(dateKey, todaysGeneration.size),
        time: todaysGeneration.time,
    }
}

// requires the dictionary to be loaded first
export const resolveBoard = (date: Date): ResolvedBoard => {
    const board = getBoardSettings(date)

    return { ...board, totalWords: [...solve(board.letters, board.size)] }
}
