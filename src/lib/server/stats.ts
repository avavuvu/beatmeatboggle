import { eq } from "drizzle-orm"
import { db } from "../../../db"
import { boards } from "../../../db/schema"
import type { DayStats } from "../statsTypes"
import { getDayScores } from "./scores"
import { getDayWordStats } from "./words"

export const PUBLIC_STATS_HEADERS = {
    "netlify-cdn-cache-control": "public, durable, s-maxage=86400, stale-while-revalidate=3600",
    "netlify-cache-tag": "stats-page",
}


export const getDayStats = async (dateKey: string): Promise<DayStats | null> => {
    const [{ words }, scores, [board]] = await Promise.all([
        getDayWordStats(dateKey),
        getDayScores(dateKey),
        db
            .select({ size: boards.size, letters: boards.letters })
            .from(boards)
            .where(eq(boards.dateKey, dateKey)),
    ])

    if (!board || words.length === 0) {
        return null
    }

    return {
        dateKey,
        size: board.size,
        letters: board.letters,
        words,
        scores,
    }
}
