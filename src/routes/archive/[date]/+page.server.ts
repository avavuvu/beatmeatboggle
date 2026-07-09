import type { RequestEvent } from "@sveltejs/kit"
import { db } from "../../../../db"
import { avasWords } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { error } from "@sveltejs/kit"

export const load = async ({ params }: RequestEvent) => {
    const [data] = await db
        .select({ words: avasWords.words, totalWords: avasWords.totalWords })
        .from(avasWords)
        .where(eq(avasWords.dateKey, params.date!))

    if (!data) error(404, "No puzzle found for this date")

    return {
        date: new Date(params.date + "T00:00:00"),
        avasWords: data.words,
        totalWords: data.totalWords,
    }
}
