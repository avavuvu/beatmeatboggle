import type { Config, Context } from "@netlify/functions"
import { getOrCreateBoard } from "../../src/lib/server/board"
import { getGameDateKey } from "../../src/lib/server/gameDate"
import { isValidDateKey } from "../../src/lib/dates"

export default async function getBoard(req: Request, context: Context) {
    if (req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 })
    }

    const dateKey = new URL(req.url).searchParams.get("dateKey")

    if (!dateKey || !isValidDateKey(dateKey)) {
        return Response.json({ error: "Invalid dateKey" }, { status: 400 })
    }

    // generating on demand for a future date would let anyone read tomorrow's puzzle today,
    // but ava needs to play ahead
    const isAdmin = req.headers.get("authorization") === process.env.ADMIN_TOKEN

    if (dateKey > getGameDateKey() && !isAdmin) {
        return Response.json({ error: "Board not available yet" }, { status: 404 })
    }

    return Response.json(await getOrCreateBoard(dateKey))
}

export const config: Config = {
    path: "/api/board",
}
