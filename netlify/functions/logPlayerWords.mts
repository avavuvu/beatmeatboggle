import type { Config, Context } from "@netlify/functions"
import { db } from "../../db"
import { avasWords } from "../../db/schema"
import { eq } from "drizzle-orm"
import { dailyAverage, PlayError, recordPlay } from "../../src/lib/server/plays"
import { isValidDateKey } from "../../src/lib/dates"
import { getGameDateKey } from "../../src/lib/server/gameDate"
import { isPatron } from "../../src/lib/server/patronRequest"

export default async function logPlayerWords(req: Request, context: Context) {
    if (req.method === "POST") {
        let body: Record<string, unknown>
        try {
            body = await req.json()
        } catch {
            return new Response("Bad Request", { status: 400 })
        }

        try {
            const play = await recordPlay(
                {
                    dateKey: body.dateKey,
                    words: body.words,
                    fairFight: body.fairFight,
                    playerId: body.playerId,
                    challengedBy: body.challengedBy,
                },
                { country: context.geo?.country?.name ?? null, city: context.geo?.city ?? null }
            )

            return Response.json(
                {
                    success: true,
                    score: play.score,
                    mode: play.mode,
                    recorded: play.recorded,
                    average: await dailyAverage(body.dateKey as string),
                },
                { status: 201 }
            )
        } catch (e) {
            if (e instanceof PlayError) {
                return Response.json({ error: e.message }, { status: e.status })
            }
            throw e
        }
    }

    if (req.method === "GET") {
        const dateKey = new URL(req.url).searchParams.get("dateKey")

        if (!dateKey || !isValidDateKey(dateKey)) {
            return Response.json({ error: "Invalid dateKey" }, { status: 400 })
        }

        if (dateKey > getGameDateKey()) {
            return Response.json({ error: "Board not available yet" }, { status: 404 })
        }

        if (dateKey < getGameDateKey() && !isPatron(req)) {
            return Response.json({ error: "Archive is for patrons" }, { status: 403 })
        }

        const [ava] = await db
            .select({ words: avasWords.words })
            .from(avasWords)
            .where(eq(avasWords.dateKey, dateKey))

        return Response.json({ success: true, avasWords: ava?.words ?? null }, { status: 200 })
    }

    return new Response("Method Not Allowed", { status: 405 })
}

export const config: Config = {
    path: "/api/player-words",
}
