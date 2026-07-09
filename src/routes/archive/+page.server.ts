import type { RequestEvent } from "@sveltejs/kit"
import { db } from "../../../db"
import { avasWords } from "../../../db/schema"
import { desc } from "drizzle-orm"
import { parseSession } from "$lib/session"
import type { PatronSession } from "$lib/session"
import { toISODateKey } from "$lib/constants"

export const load = async ({ cookies, url }: RequestEvent) => {
    const error = url.searchParams.get("error")
    const session = parseSession<PatronSession>(cookies.get("patron_session"))
    console.log(session)
    const tier = session?.tier
    const fullName = session?.fullName ?? null
    const thumbUrl = session?.thumbUrl ?? null

    const HOUR = 60 * 60 * 1000
    const today = toISODateKey(new Date(Date.now() + 10 * HOUR))
    const tomorrow = toISODateKey(new Date(Date.now() + 10 * HOUR + 24 * HOUR))

    const rows = await db
        .select({ dateKey: avasWords.dateKey })
        .from(avasWords)
        .orderBy(desc(avasWords.dateKey))

    return {
        tier,
        fullName,
        thumbUrl,
        error,
        dates: rows
            .map((r) => r.dateKey)
            .filter((d) => d !== today)
            .filter((d) => d !== tomorrow),
    }
}
