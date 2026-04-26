import type { Config, Context } from "@netlify/functions";
import { db } from "../../db";
import { playerWords, avasWords } from "../../db/schema";
import { eq, count } from "drizzle-orm";

export default async function logPlayerWords(req: Request, context: Context) {
    if (req.method === 'POST') {
        let dateKey: string;
        let words: string[];

        try {
            const body = await req.json();
            dateKey = body.dateKey;
            words = body.words;

            if (!dateKey || !Array.isArray(words)) {
                return Response.json({ error: 'Missing dateKey or words' }, { status: 400 });
            }
        } catch {
            return new Response('Bad Request', { status: 400 });
        }

        await db.insert(playerWords).values({
            dateKey,
            words,
            wordCount: words.length,
        });

        return Response.json({ success: true }, { status: 201 });
    }

    if (req.method === 'GET') {
        const url = new URL(req.url);
        const dateKey = url.searchParams.get('dateKey');

        if (!dateKey) {
            return Response.json({ error: 'Missing dateKey' }, { status: 400 });
        }

        const stats = await db
            .select({
                wordCount: playerWords.wordCount,
                players: count(),
            })
            .from(playerWords)
            .where(eq(playerWords.dateKey, dateKey))
            .groupBy(playerWords.wordCount)
            .orderBy(playerWords.wordCount);

        const totalWords = stats.reduce((total, stat) => total + stat.wordCount * stat.players, 0);
        const totalPlayers = stats.reduce((total, stat) => total + stat.players, 0);
        const average = totalPlayers > 0 ? totalWords / totalPlayers : 0;

        const [ava] = await db
            .select({ words: avasWords.words })
            .from(avasWords)
            .where(eq(avasWords.dateKey, dateKey));

        return Response.json({
            success: true,
            average,
            avasWords: ava.words ?? null,
        }, { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });
}

export const config: Config = {
    path: "/api/player-words"
};
