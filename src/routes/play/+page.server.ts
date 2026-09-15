import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getGameDateKey } from "$lib/server/gameDate"
import type { ResolvedBoard } from "$lib/board"
import { db } from "../../../db"
import { avasWords } from "../../../db/schema"
import { eq } from "drizzle-orm"

export const load: PageServerLoad = async ({ setHeaders, url }) => {
    const dateKey = getGameDateKey()

    setHeaders({
        "netlify-cdn-cache-control":
            "public, s-maxage=86400, stale-while-revalidate=3600",
        "netlify-cache-tag": "play-page",
    })

    // sveltekit's own fetch routes same-origin requests internally, where /api/board (a netlify
    // function) does not exist. the global fetch makes a real http request that reaches it.
    const [[ava], boardResponse] = await Promise.all([
        db.select({ words: avasWords.words }).from(avasWords).where(eq(avasWords.dateKey, dateKey)),
        globalThis.fetch(new URL(`/api/board?dateKey=${dateKey}`, url.origin)),
    ])

    if (!boardResponse.ok) {
        error(503, "Today's board is not available")
    }

    const board: ResolvedBoard = await boardResponse.json()

    return {
        avasWords: ava?.words ?? null,
        board,
        dateKey,
    }
}
