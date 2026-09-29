import type { Config } from "@netlify/functions"
import { getPreviousGameDateKey } from "../../src/lib/server/gameDate"
import { getDayWordStats } from "../../src/lib/server/words"
import { PUBLIC_STATS_HEADERS } from "../../src/lib/server/stats"

export default async function getWordPlayPercent(req: Request) {
    if (req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 })
    }

    const dateKey = getPreviousGameDateKey()
    const { players, words } = await getDayWordStats(dateKey)

    if (words.length === 0) {
        return Response.json({ error: "No board found for this date" }, { status: 404 })
    }

    return Response.json(
        { dateKey, players, words },
        { headers: PUBLIC_STATS_HEADERS }
    )
}

export const config: Config = {
    path: "/api/word",
}
