import type { Config, Context } from "@netlify/functions"
import { db } from "../../db"
import { playerWords, avasWords } from "../../db/schema"
import { eq, avg, gte, and } from "drizzle-orm"

export default async function logPlayerWords(req: Request, context: Context) {
    if (req.method === "POST") {
        let dateKey: string
        let words: string[]
        let score: number
        let fairFight: boolean

        try {
            const body = await req.json()
            dateKey = body.dateKey
            words = body.words
            score = typeof body.score === "number" ? body.score : -1
            fairFight = body.fairFight ?? false

            if (
                !dateKey ||
                !Array.isArray(words) ||
                typeof score !== "number"
            ) {
                return Response.json(
                    { error: "Missing dateKey, words, or score" },
                    { status: 400 }
                )
            }
        } catch {
            return new Response("Bad Request", { status: 400 })
        }

        if (words.length > 0) {
            await db.insert(playerWords).values({
                dateKey,
                words,
                score,
                fairFight,
                country: context.geo?.country?.name ?? null,
                city: context.geo?.city ?? null,
            })
        }

        const [{ average }] = await db
            .select({ average: avg(playerWords.score) })
            .from(playerWords)
            .where(
                and(eq(playerWords.dateKey, dateKey), gte(playerWords.score, 0))
            )

        return Response.json(
            { success: true, average: Number(average ?? 0) },
            { status: 201 }
        )
    }

    if (req.method === "GET") {
        const url = new URL(req.url)
        const dateKey = url.searchParams.get("dateKey")

        if (!dateKey) {
            return Response.json({ error: "Missing dateKey" }, { status: 400 })
        }

        const [ava] = await db
            .select({ words: avasWords.words })
            .from(avasWords)
            .where(eq(avasWords.dateKey, dateKey))

        return Response.json(
            {
                success: true,
                avasWords: ava.words ?? null,
            },
            { status: 200 }
        )
    }

    return new Response("Method Not Allowed", { status: 405 })
}

export const config: Config = {
    path: "/api/player-words",
}
