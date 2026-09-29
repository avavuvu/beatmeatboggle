export const WEEKDAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const

export type Weekday = (typeof WEEKDAYS)[number]
export type GenerationSettings = {
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

export type BoardSettings = {
    size: number
    letters: string[]
    time: number
}

export type ResolvedBoard = BoardSettings & { totalWords: string[] }

export const DICE = ["classic", "word"] as const
export type Dice = (typeof DICE)[number]

export const DICE_LABELS: Record<Dice, { name: string; description: string }> = {
    classic: {
        name: "Classic",
        description: "Uses simulated dice for combinations that could appear on a real board",
    },
    word: {
        name: "Word-based",
        description: "Places a long word and fills the rest of the board around it",
    },
}

export const BOARD_SIZES = [4, 5] as const
export type BoardSize = (typeof BOARD_SIZES)[number]
