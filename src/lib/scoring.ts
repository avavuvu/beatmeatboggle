import { dirtyWords } from "./dictionary/dirtyWords"

export type ScoreItem = {
    points: number
    reason?: "opponent bonus" | "length" | "dirty bonus" | "unique"
}

export const wordLengthToPoints = (word: string) =>
    Math.floor(Math.pow(word.length, 2) / 4)

export const calculatePoints = (
    word: string,
    otherPlayersWords: string[],
    awardUniqueBonus: boolean,
    fairFight: boolean,
    hasComparison: boolean = true
) => {
    let points = 0

    const lengthPoints = wordLengthToPoints(word)
    points += lengthPoints

    const pointsArray: ScoreItem[] = [
        {
            points: lengthPoints,
            reason: "length",
        },
    ]

    if (
        hasComparison &&
        awardUniqueBonus &&
        !otherPlayersWords.includes(word)
    ) {
        const reason = fairFight ? "unique" : "opponent bonus"

        points += 1
        pointsArray.push({
            points: 1,
            reason,
        })
    }

    if (dirtyWords.has(word)) {
        points += 4
        pointsArray.push({
            points: 4,
            reason: "dirty bonus",
        })
    }

    return {
        pointsArray,
        points,
    }
}

export const calculateTotalPoints = (
    words: string[],
    otherPlayersWords: string[],
    awardUniqueBonus: boolean,
    fairFight: boolean,
    hasComparison: boolean = true
) =>
    words.reduce(
        (total, word) =>
            total +
            calculatePoints(
                word,
                otherPlayersWords,
                awardUniqueBonus,
                fairFight,
                hasComparison
            ).points,
        0
    )
