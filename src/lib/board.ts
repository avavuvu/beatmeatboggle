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
