import { toISODateKey } from "../constants"
import type { BoardSettings, BoardSize, Dice, ResolvedBoard } from "../board"
import { GENERATORS } from "./generateBoard"
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
    size: BoardSize
    dice: Dice
    time: number
}

const threeMinutes = 3 * 60
const fourMinutes = 4 * 60

export const weekDayMap: Record<Weekday, GenerationSettings> = {
    Monday: {
        size: 4,
        dice: "classic",
        time: threeMinutes,
    },
    Tuesday: {
        size: 4,
        dice: "word",
        time: threeMinutes,
    },
    Wednesday: {
        size: 4,
        dice: "word",
        time: threeMinutes,
    },
    Thursday: {
        size: 4,
        dice: "word",
        time: threeMinutes,
    },
    Friday: {
        size: 4,
        dice: "word",
        time: threeMinutes,
    },
    Saturday: {
        size: 5,
        dice: "word",
        time: fourMinutes,
    },
    Sunday: {
        size: 5,
        dice: "word",
        time: fourMinutes,
    },
}

export const getBoardSettings = (date: Date): BoardSettings => {
    const dateKey = toISODateKey(date)
    const { size, dice, time } = weekDayMap[WEEKDAYS[date.getUTCDay()]]

    return {
        size,
        letters: GENERATORS[dice](dateKey, size),
        time,
    }
}

// requires the dictionary to be loaded first
export const resolveBoard = (date: Date): ResolvedBoard => {
    const board = getBoardSettings(date)

    return { ...board, totalWords: [...solve(board.letters, board.size)] }
}

export type PracticeBoardParams = {
    size: BoardSize
    time: number
    dice: Dice | "custom"
    override?: string
    seed?: string
}

export const resolvePracticeBoard = (params: PracticeBoardParams): ResolvedBoard => {
    const time = params.time * 60

    let letters: string[]

    if (params.dice === "custom") {
        letters = (params.override ?? "").split("").slice(0, params.size * params.size)
    } else {
        const seed = params.seed ?? String(Date.now())

        letters = GENERATORS[params.dice](seed, params.size)
    }

    return {
        size: params.size,
        letters,
        time,
        totalWords: [...solve(letters, params.size)],
    }
}
