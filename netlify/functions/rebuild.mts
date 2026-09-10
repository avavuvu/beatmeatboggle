import type { Config } from "@netlify/functions"
import { purgeCache } from "@netlify/functions"
import { getOrCreateBoard } from "../../src/lib/server/board"
import { getGameDateKey } from "../../src/lib/server/gameDate"

// the board must exist before the purge, or the cdn caches a page with no board for a day
export default async function rebuild(): Promise<Response> {
    await getOrCreateBoard(getGameDateKey())
    await purgeCache({ tags: ["play-page"] })

    return new Response("OK", { status: 200 })
}

export const config: Config = {
    schedule: "0 14 * * *",
}
