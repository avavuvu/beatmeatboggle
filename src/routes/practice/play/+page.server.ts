import { redirect } from "@sveltejs/kit"
import { resolvePracticeBoard } from "$lib/server/boardSettings"
import { loadDictionaryFromDisk } from "$lib/server/dictionary"
import { BOARD_SIZES, DICE, type Dice } from "$lib/board"
import type { RequestEvent } from "@sveltejs/kit"

export const load = async ({ url }: RequestEvent) => {
    const override = url.searchParams.get("override") ?? undefined
    const seed = url.searchParams.get("seed") ?? undefined

    if (!override && !seed) {
        const params = new URLSearchParams(url.searchParams)
        params.set("seed", String(Date.now()))

        redirect(303, `/practice/play?${params}`)
    }

    const diceParam = url.searchParams.get("dice")
    const dice: Dice | "custom" =
        diceParam === "custom" && override
            ? "custom"
            : (DICE.find((d) => d === diceParam) ?? "word")

    const sizeParam = Number(url.searchParams.get("size"))
    const size = BOARD_SIZES.find((s) => s === sizeParam) ?? 4

    await loadDictionaryFromDisk()

    const board = resolvePracticeBoard({
        size,
        time: Number(url.searchParams.get("time")) || 3,
        dice,
        override,
        seed,
    })

    const practiceKey = override ? `custom-${override}` : seed!

    return { board, practiceKey }
}
