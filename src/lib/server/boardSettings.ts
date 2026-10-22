import { toISODateKey } from "../constants"
import { weekDayMap, WEEKDAYS, type BoardSize, type Dice, type ResolvedBoard } from "../board"
import { generateBoard } from "./generateBoard"
import { solve } from "../dictionary/solver"

export const resolveBoard = (date: Date, seed = toISODateKey(date)): ResolvedBoard => {
    const { size, dice, time } = weekDayMap[WEEKDAYS[date.getUTCDay()]]
    const { letters, seedWord, ladder, words } = generateBoard(dice, seed, size)

    return { size, letters, time, seedWord, ladder, totalWords: words }
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

    if (params.dice === "custom") {
        const letters = (params.override ?? "").split("").slice(0, params.size * params.size)
        return { size: params.size, letters, time, seedWord: null, ladder: [], totalWords: [...solve(letters, params.size)] }
    }

    const { letters, seedWord, ladder, words } = generateBoard(params.dice, params.seed ?? String(Date.now()), params.size)
    return { size: params.size, letters, time, seedWord, ladder, totalWords: words }
}
