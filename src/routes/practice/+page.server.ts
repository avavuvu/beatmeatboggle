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
    const tier = session?.tier
    const fullName = session?.fullName ?? null
    const thumbUrl = session?.thumbUrl ?? null

    return {
        tier,
        fullName,
        thumbUrl,
        error,
    }
}
