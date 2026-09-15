import { eq } from "drizzle-orm"
import { db } from "../../../db"
import { boards } from "../../../db/schema"
import { resolveBoard } from "./boardSettings"
import { dateFromKey } from "../constants"
import { loadDictionaryFromDisk } from "./dictionary"

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
