import type { Config } from "@netlify/functions"
import { isValidDateKey } from "../../src/lib/dates"
import { getGameDateKey } from "../../src/lib/server/gameDate"
import { getDayPlayStats as loadDayPlayStats } from "../../src/lib/server/dayPlayStats"

const TODAY_CACHE = "public, durable, s-maxage=600, stale-while-revalidate=600"
const PAST_CACHE = "public, durable, s-maxage=86400, stale-while-revalidate=3600"

export default async function getDayPlayStats(req: Request) {
    if (req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 })
    }

    const dateKey = new URL(req.url).searchParams.get("dateKey")

    if (!dateKey || !isValidDateKey(dateKey)) {
        return Response.json({ error: "Invalid dateKey" }, { status: 400 })
    }

    const today = getGameDateKey()

    if (dateKey > today) {
        return Response.json({ error: "Board not available yet" }, { status: 404 })
    }

    return Response.json(await loadDayPlayStats(dateKey), {
        headers: {
            "netlify-cdn-cache-control": dateKey === today ? TODAY_CACHE : PAST_CACHE,
            "netlify-vary": "query=dateKey",
        },
    })
}

export const config: Config = {
    path: "/api/day-stats",
}
