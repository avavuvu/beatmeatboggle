import { redirect } from "@sveltejs/kit"
import { parseSession } from "$lib/server/session"
import type { PatronSession } from "$lib/server/session"
import { resolvePracticeBoard } from "$lib/server/boardSettings"
import { loadDictionaryFromDisk } from "$lib/server/dictionary"
import type { RequestEvent } from "@sveltejs/kit"

export const load = async ({ url, cookies }: RequestEvent) => {
    const session = parseSession<PatronSession>(cookies.get("patron_session"))
    if (session?.tier !== "paid") redirect(303, "/practice?kickback")

    const override = url.searchParams.get("override") ?? undefined
    const seed = url.searchParams.get("seed") ?? undefined

    if (!override && !seed) {
        const params = new URLSearchParams(url.searchParams)
        params.set("seed", String(Date.now()))

        redirect(303, `/practice/play?${params}`)
    }

    await loadDictionaryFromDisk()

    const board = resolvePracticeBoard({
        size: Number(url.searchParams.get("size")) === 5 ? 5 : 4,
        time: Number(url.searchParams.get("time")) || 3,
        dice:
            (url.searchParams.get("dice") as
                | "classic"
                | "clusters"
                | "custom") ?? "clusters",
        override,
        seed,
    })

    const practiceKey = override ? `custom-${override}` : seed!

    return { board, practiceKey }
}
