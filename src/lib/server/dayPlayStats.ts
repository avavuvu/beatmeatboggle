import { and, count, eq } from "drizzle-orm"
import { db } from "../../../db"
import { playerWords } from "../../../db/schema"
import { MIN_PLAYERS_FOR_DAY_STATS, type DayPlayStats } from "../dayPlayStats"
import { getScoreDistribution } from "./scores"
import { getDayWordStats } from "./words"

export const getDayPlayStats = async (
    dateKey: string
): Promise<DayPlayStats> => {
    const [{ players }] = await db
        .select({ players: count() })
        .from(playerWords)
        .where(
            and(eq(playerWords.dateKey, dateKey), eq(playerWords.mode, "daily"))
        )

    if (players < MIN_PLAYERS_FOR_DAY_STATS) {
        return { players, shares: null, distribution: null }
    }

    const [wordStats, distribution] = await Promise.all([
        getDayWordStats(dateKey),
        getScoreDistribution(dateKey),
    ])

    return {
        players: wordStats.players,
        shares: Object.fromEntries(
            wordStats.words
                .filter(({ plays }) => plays > 0)
                .map(({ word, percentage }) => [word, percentage / 100])
        ),
        distribution,
    }
}
