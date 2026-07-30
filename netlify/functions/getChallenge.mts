import type { Config, Context } from "@netlify/functions"
import { db } from "../../db"
import { avasWords, playerWords } from "../../db/schema"
import { and, desc, eq } from "drizzle-orm"
import { decodeChallenge } from "../../src/lib/challenge/challengeToken"

export default async function getChallenge(req: Request, context: Context) {
    if (req.method !== "GET") {
        return new Response("Method Not Allowed", { status: 405 })
    }

    const url = new URL(req.url)
    const token = url.searchParams.get("token")

    if (!token) {
        return Response.json({ error: "Missing token" }, { status: 400 })
    }

    const decoded = decodeChallenge(token)

    if (!decoded) {
        return Response.json({ error: "Invalid challenge token" }, { status: 400 })
    }

    const { date: dateKey, playerId, name } = decoded

    const [ava] = await db
        .select({ totalWords: avasWords.totalWords })
        .from(avasWords)
        .where(eq(avasWords.dateKey, dateKey))

    const [challenger] = await db
        .select({ words: playerWords.words })
        .from(playerWords)
        .where(
            and(
                eq(playerWords.dateKey, dateKey),
                eq(playerWords.playerId, playerId)
            )
        )
        .orderBy(desc(playerWords.createdAt))
        .limit(1)

    if (!challenger) {
        return Response.json({ error: "Challenge not found" }, { status: 404 })
    }

    return Response.json(
        {
            success: true,
            date: dateKey,
            opponentWords: challenger.words,
            opponentName: name || "Your friend",
            totalWords: ava?.totalWords ?? null,
            challengedBy: playerId,
        },
        { status: 200 }
    )
}

export const config: Config = {
    path: "/api/challenge",
}
