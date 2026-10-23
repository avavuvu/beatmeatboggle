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

export type HiddenWord = {
    seedWord: string | null
    ladder: string[]
}

export type ResolvedBoard = BoardSettings &
    HiddenWord & { totalWords: string[] }

export const DICE = ["classic", "word", "spread", "bag"] as const
export type Dice = (typeof DICE)[number]

// spread and bag exist for research and practice-by-url only
export const PUBLIC_DICE = [
    "classic",
    "word",
] as const satisfies readonly Dice[]

export const DICE_LABELS: Record<Dice, { name: string; description: string }> =
    {
        classic: {
            name: "Classic",
            description:
                "Simulated dice, rerolled until the board has enough in it",
        },
        word: {
            name: "Word-based",
            description: "Hides a long word and fills the board around it",
        },
        spread: {
            name: "Spread",
            description:
                "Hides a long word across the whole board and fills from a weighted letter bag",
        },
        bag: {
            name: "Letter bag",
            description:
                "No hidden word, just a balanced draw from a letter bag",
        },
    }

export const BOARD_SIZES = [4, 5] as const
export type BoardSize = (typeof BOARD_SIZES)[number]
