import type { Config } from "@netlify/functions"
import { rerollBoard, RerollError } from "../../src/lib/server/board"

export default async function reroll(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 })
    }

    if (req.headers.get("authorization") !== process.env.ADMIN_TOKEN) {
        return new Response("Unauthorized", { status: 401 })
    }

    let dateKey: unknown
    try {
        dateKey = (await req.json()).dateKey
    } catch {
        return new Response("Bad Request", { status: 400 })
    }

    if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return Response.json({ error: "Invalid dateKey" }, { status: 400 })
    }

    try {
        return Response.json(await rerollBoard(dateKey))
    } catch (e) {
        if (e instanceof RerollError) {
            return Response.json({ error: e.message }, { status: 409 })
        }

        throw e
    }
}

export const config: Config = {
    path: "/api/board/reroll",
}
