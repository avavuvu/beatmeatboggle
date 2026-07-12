import type { PageServerLoad } from "./$types"
import { toISODateKey } from "$lib/constants"
import { db } from "../../../db"
import { avasWords } from "../../../db/schema"
import { eq } from "drizzle-orm"

export const load: PageServerLoad = async () => {
    const date = new Date(Date.now() + 10 * 60 * 60 * 1000)
    const dateKey = toISODateKey(date)

    const [ava] = await db
        .select({
            words: avasWords.words,
            totalWords: avasWords.totalWords,
            imageData: avasWords.imageData,
            message: avasWords.message,
        })
        .from(avasWords)
        .where(eq(avasWords.dateKey, dateKey))

    console.log(date)

    return {
        avasPayload: ava
            ? {
                  words: ava.words,
                  totalWords: ava.totalWords,
                  message: ava.message,
                  imageData: ava.imageData,
              }
            : null,
        date,
    }
}
