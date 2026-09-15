export type BoardSettings = {
    size: number
    letters: string[]
    time: number
}

export type ResolvedBoard = BoardSettings & { totalWords: string[] }
