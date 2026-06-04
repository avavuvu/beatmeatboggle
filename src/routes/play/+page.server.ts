import type { PageServerLoad } from "./$types"
import { toISODateKey } from "$lib/constants"
import { db } from "../../../db"
import { avasWords } from "../../../db/schema"
import { eq } from "drizzle-orm"

export const load: PageServerLoad = async () => {
    // make date here to make sure no chance of desync
    const date = new Date()
    const dateKey = toISODateKey(date)

    const [ava] = await db
        .select({
            words: avasWords.words,
            totalWords: avasWords.totalWords,
        })
        .from(avasWords)
        .where(eq(avasWords.dateKey, dateKey))

    return {
        avasWords: ava?.words ?? null,
        totalWords: ava?.totalWords ?? null,
        date,
    }
}
