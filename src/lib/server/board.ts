import { eq } from "drizzle-orm"
import { db } from "../../../db"
import { avasWords, boards, playerWords } from "../../../db/schema"
import { resolveBoard } from "./boardSettings"
import { dateFromKey } from "../constants"
import { loadDictionaryFromDisk } from "./dictionary"
import { getGameDateKey } from "./gameDate"

export const getOrCreateBoard = async (dateKey: string) => {
    const [existing] = await db.select().from(boards).where(eq(boards.dateKey, dateKey))

    if (existing) {
        return existing
    }

    await loadDictionaryFromDisk()

    const { size, letters, time, totalWords } = resolveBoard(dateFromKey(dateKey))

    const [inserted] = await db
        .insert(boards)
        .values({ dateKey, size, letters, time, totalWords })
        .onConflictDoNothing({ target: boards.dateKey })
        .returning()

    if (inserted) {
        return inserted
    }

    // a concurrent request won the insert; its row is the one that counts
    const [raced] = await db.select().from(boards).where(eq(boards.dateKey, dateKey))
    return raced
}

export class RerollError extends Error {}

export const rerollBoard = async (dateKey: string) => {
    if (dateKey <= getGameDateKey()) {
        throw new RerollError("Only future boards can be rerolled")
    }

    const [player] = await db
        .select({ id: playerWords.id })
        .from(playerWords)
        .where(eq(playerWords.dateKey, dateKey))
        .limit(1)

    if (player) {
        throw new RerollError("Players have already played this board")
    }

    await loadDictionaryFromDisk()

    const seed = `${dateKey}-${crypto.randomUUID()}`
    const { size, letters, time, totalWords } = resolveBoard(dateFromKey(dateKey), seed)

    const [[board]] = await Promise.all([
        db
            .insert(boards)
            .values({ dateKey, size, letters, time, totalWords })
            .onConflictDoUpdate({ target: boards.dateKey, set: { letters, totalWords } })
            .returning(),
        db.delete(avasWords).where(eq(avasWords.dateKey, dateKey)),
    ])

    return board
}
