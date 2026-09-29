import type { Config } from "@netlify/functions"
import { getPreviousGameDateKey } from "../../src/lib/server/gameDate"
import { getDayScores } from "../../src/lib/server/scores"
import { PUBLIC_STATS_HEADERS } from "../../src/lib/server/stats"

export default async function getScores(req: Request) {
    if (req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 })
    }

    const dateKey = getPreviousGameDateKey()

    return Response.json(
        { dateKey, ...(await getDayScores(dateKey)) },
        { headers: PUBLIC_STATS_HEADERS }
    )
}

export const config: Config = {
    path: "/api/scores",
}
