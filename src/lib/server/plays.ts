import { and, avg, eq, gte } from "drizzle-orm"
import { db } from "../../../db"
import { avasWords, playerWords, type PlayMode } from "../../../db/schema"
import { calculateTotalPoints } from "../scoring"
import { getOrCreateBoard } from "./board"
import { loadDirtyWordsFromDisk } from "./dictionary"
import { getGameDateKey } from "./gameDate"
import { isValidDateKey } from "../dates"
import { PlayError, validatePlay, type PlaySubmission } from "./validatePlay"

export { PlayError, validatePlay, type PlaySubmission, type ValidPlay } from "./validatePlay"

export type RecordedPlay = {
    mode: PlayMode
    words: string[]
    score: number
    recorded: boolean
}

export const dailyAverage = async (dateKey: string): Promise<number> => {
    const [{ average }] = await db
        .select({ average: avg(playerWords.score) })
        .from(playerWords)
        .where(and(eq(playerWords.dateKey, dateKey), eq(playerWords.mode, "daily"), gte(playerWords.score, 0)))
    return Number(average ?? 0)
}

export const recordPlay = async (
    body: PlaySubmission,
    geo: { country: string | null; city: string | null }
): Promise<RecordedPlay> => {
    const today = getGameDateKey()
    if (typeof body.dateKey !== "string" || !isValidDateKey(body.dateKey)) throw new PlayError("Invalid dateKey", 400)
    if (body.dateKey > today) throw new PlayError("Board not available yet", 400)

    const board = await getOrCreateBoard(body.dateKey)
    const { dateKey, words, fairFight: fair, playerId, challengedBy, mode } = validatePlay(body, today, board.totalWords)

    await loadDirtyWordsFromDisk()
    const [ava] = await db.select({ words: avasWords.words }).from(avasWords).where(eq(avasWords.dateKey, dateKey))
    const score = calculateTotalPoints(words, ava?.words ?? [], true, fair, ava !== undefined)

    if (words.length === 0) {
        return { mode, words, score, recorded: false }
    }

    if (mode === "daily" && playerId !== null) {
        const [existing] = await db
            .select({ id: playerWords.id })
            .from(playerWords)
            .where(and(eq(playerWords.dateKey, dateKey), eq(playerWords.playerId, playerId), eq(playerWords.mode, "daily")))
            .limit(1)
        if (existing) {
            return { mode, words, score, recorded: false }
        }
    }

    await db.insert(playerWords).values({
        dateKey,
        words,
        score,
        fairFight: fair,
        country: geo.country,
        city: geo.city,
        playerId,
        challengedBy,
        mode,
    })

    return { mode, words, score, recorded: true }
}
