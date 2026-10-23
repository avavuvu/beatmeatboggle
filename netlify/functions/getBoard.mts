import type { Config, Context } from "@netlify/functions"
import { getOrCreateBoard } from "../../src/lib/server/board"
import { getGameDateKey } from "../../src/lib/server/gameDate"
import { isValidDateKey } from "../../src/lib/dates"
import { isAdmin, isPatron } from "../../src/lib/server/patronRequest"

export default async function getBoard(req: Request, context: Context) {
    if (req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 })
    }

    const dateKey = new URL(req.url).searchParams.get("dateKey")

    if (!dateKey || !isValidDateKey(dateKey)) {
        return Response.json({ error: "Invalid dateKey" }, { status: 400 })
    }

    const today = getGameDateKey()

    if (dateKey > today && !isAdmin(req)) {
        return Response.json({ error: "Board not available yet" }, { status: 404 })
    }

    if (dateKey < today && !isAdmin(req) && !isPatron(req)) {
        return Response.json({ error: "Archive is for patrons" }, { status: 403 })
    }

    return Response.json(await getOrCreateBoard(dateKey))
}

export const config: Config = {
    path: "/api/board",
}
