import { and, asc, desc, eq, gte, sql } from "drizzle-orm"
import { db } from "../../../db"
import { avasWords, playerWords } from "../../../db/schema"
import { calculateTotalPoints } from "../scoring"
import type { DayScores } from "../statsTypes"
import { loadDirtyWordsFromDisk } from "./dictionary"

export const getDayScores = async (dateKey: string): Promise<DayScores> => {
    const scoredOnDay = and(eq(playerWords.dateKey, dateKey), gte(playerWords.score, 0))

    const [distribution, [ava], [topPlayer]] = await Promise.all([
        db
            .select({
                score: playerWords.score,
                count: sql<number>`count(*)::int`,
            })
            .from(playerWords)
            .where(scoredOnDay)
            .groupBy(playerWords.score)
            .orderBy(playerWords.score),
        db
            .select({ words: avasWords.words })
            .from(avasWords)
            .where(eq(avasWords.dateKey, dateKey)),
        db
            .select({
                score: playerWords.score,
                words: sql<number>`jsonb_array_length(${playerWords.words})::int`,
                country: playerWords.country,
            })
            .from(playerWords)
            .where(scoredOnDay)
            .orderBy(desc(playerWords.score), asc(playerWords.createdAt))
            .limit(1),
        loadDirtyWordsFromDisk(),
    ])

    return {
        players: distribution.reduce((total, { count }) => total + count, 0),
        distribution,
        avasScore: ava ? calculateTotalPoints(ava.words, [], false, false) : null,
        avasWords: ava?.words ?? null,
        topPlayer: topPlayer ?? null,
    }
}
