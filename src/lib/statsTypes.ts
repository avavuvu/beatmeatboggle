export type WordStat = {
    word: string
    plays: number
    percentage: number
}

export type ScoreCount = { score: number; count: number }

export type DayScores = {
    players: number
    distribution: ScoreCount[]
    avasScore: number | null
    avasWords: string[] | null
    topPlayer: { score: number; words: number; country: string | null } | null
}

export type DayStats = {
    dateKey: string
    size: number
    letters: string[]
    words: WordStat[]
    scores: DayScores
}
