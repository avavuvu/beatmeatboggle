import { redirect } from "@sveltejs/kit"
import { parseSession } from "$lib/session"
import type { PatronSession } from "$lib/session"
import { getPracticeBoardSettings } from "$lib/boardSettings"
import type { RequestEvent } from "@sveltejs/kit"

export const load = ({ url, cookies }: RequestEvent) => {
    const session = parseSession<PatronSession>(cookies.get("patron_session"))
    if (session?.tier !== "paid") redirect(303, "/practice?kickback")

    const override = url.searchParams.get("override") ?? undefined
    const seed = url.searchParams.get("seed") ?? undefined

    const board = getPracticeBoardSettings({
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

    const practiceKey = override ? `custom-${override}` : (seed ?? "practice")

    return { board, practiceKey }
}
