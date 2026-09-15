import type { RequestEvent } from "@sveltejs/kit"
import { db } from "../../../db"
import { avasWords } from "../../../db/schema"
import { desc } from "drizzle-orm"
import { toISODateKey } from "$lib/constants"

let cachedDateKeys: string[] | null = null
let cachedAt = 0

async function getAllDateKeys(): Promise<string[]> {
    const now = Date.now()
    if (cachedDateKeys && now - cachedAt <  60 * 60 * 1000) {
        return cachedDateKeys
    }

    const rows = await db
        .select({ dateKey: avasWords.dateKey })
        .from(avasWords)
        .orderBy(desc(avasWords.dateKey))

    cachedDateKeys = rows.map((r) => r.dateKey)
    cachedAt = now

    return cachedDateKeys
}

export const load = async ({ locals, url }: RequestEvent) => {
    const error = url.searchParams.get("error")
    const tier = locals.patron?.tier ?? null
    const fullName = locals.patron?.fullName ?? null
    const thumbUrl = locals.patron?.thumbUrl ?? null
    const HOUR = 60 * 60 * 1000
    const today = toISODateKey(new Date(Date.now() + 10 * HOUR))
    const tomorrow = toISODateKey(new Date(Date.now() + 10 * HOUR + 24 * HOUR))

    const dateKeys = await getAllDateKeys()

    return {
        tier,
        fullName,
        thumbUrl,
        error,
        dates: dateKeys
            .filter((d) => d !== today)
            .filter((d) => d !== tomorrow),
    }
}
