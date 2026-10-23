import { and, asc, desc, eq, gte, sql } from "drizzle-orm"
import { db } from "../../../db"
import { avasWords, boards, playerWords } from "../../../db/schema"
import { scoreSolo } from "../scoring"
import type { DayScores, ScoreCount } from "../statsTypes"
import { loadDirtyWordsFromDisk } from "./dictionary"

const scoredOnDay = (dateKey: string) =>
    and(
        eq(playerWords.dateKey, dateKey),
        eq(playerWords.mode, "daily"),
        gte(playerWords.score, 0)
    )

export const getScoreDistribution = (dateKey: string): Promise<ScoreCount[]> =>
    db
        .select({
            score: playerWords.score,
            count: sql<number>`count(*)::int`,
        })
        .from(playerWords)
        .where(scoredOnDay(dateKey))
        .groupBy(playerWords.score)
        .orderBy(playerWords.score)

export const totalPlayers = (distribution: ScoreCount[]) =>
    distribution.reduce((total, { count }) => total + count, 0)

export const getDayScores = async (dateKey: string): Promise<DayScores> => {
    const [distribution, [ava], [board], [topPlayer]] = await Promise.all([
        getScoreDistribution(dateKey),
        db
            .select({ words: avasWords.words })
            .from(avasWords)
            .where(eq(avasWords.dateKey, dateKey)),
        db
            .select({ seedWord: boards.seedWord })
            .from(boards)
            .where(eq(boards.dateKey, dateKey)),
        db
            .select({
                score: playerWords.score,
                words: sql<number>`jsonb_array_length(${playerWords.words})::int`,
                country: playerWords.country,
            })
            .from(playerWords)
            .where(scoredOnDay(dateKey))
            .orderBy(desc(playerWords.score), asc(playerWords.createdAt))
            .limit(1),
        loadDirtyWordsFromDisk(),
    ])

    return {
        players: totalPlayers(distribution),
        distribution,
        avasScore: ava
            ? scoreSolo({
                  words: ava.words,
                  board: {
                      seedWord: board?.seedWord ?? null,
                      boardDate: dateKey,
                  },
              })
            : null,
        avasWords: ava?.words ?? null,
        topPlayer: topPlayer ?? null,
    }
}
