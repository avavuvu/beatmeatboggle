import { toISODateKey } from "../constants"
import { weekDayMap, WEEKDAYS, type BoardSettings, type BoardSize, type Dice, type ResolvedBoard } from "../board"
import { GENERATORS } from "./generateBoard"
import { solve } from "../dictionary/solver"

export const getBoardSettings = (date: Date, seed = toISODateKey(date)): BoardSettings => {
    const { size, dice, time } = weekDayMap[WEEKDAYS[date.getUTCDay()]]

    return {
        size,
        letters: GENERATORS[dice](seed, size),
        time,
    }
}

// requires the dictionary to be loaded first
export const resolveBoard = (date: Date, seed?: string): ResolvedBoard => {
    const board = getBoardSettings(date, seed)

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
