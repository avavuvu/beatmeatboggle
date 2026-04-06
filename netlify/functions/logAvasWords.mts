import type { Config, Context } from "@netlify/functions";
import { db } from "../../db";
import { avasWords } from "../../db/schema";

export default async function logAvasWords(req: Request, context: Context) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Admin auth check
    const token = req.headers.get('authorization');
    if (token !== process.env.ADMIN_TOKEN) {
        console.log(token, process.env.ADMIN_TOKEN)

        return new Response('Unauthorized', { status: 401 });
    }

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

    await db
        .insert(avasWords)
        .values({
            dateKey,
            words,
            wordCount: words.length,
        })
        .onConflictDoUpdate({
            target: avasWords.dateKey,
            set: {
                words,
                wordCount: words.length,
            },
        });

    return Response.json({ success: true, dateKey, wordCount: words.length }, { status: 201 });
}

export const config: Config = {
    path: "/api/avas-words"
};