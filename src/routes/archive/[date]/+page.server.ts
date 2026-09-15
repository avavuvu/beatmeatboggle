import type { RequestEvent } from "@sveltejs/kit"
import { db } from "../../../../db"
import { avasWords, boards } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { error } from "@sveltejs/kit"
import type { ResolvedBoard } from "$lib/board"

type ArchivedGame = {
    dateKey: string
    avasWords: string[]
    board: ResolvedBoard
}

const cachedGames = new Map<string, ArchivedGame>()

const getArchivedGame = async (dateKey: string): Promise<ArchivedGame | null> => {
    const cached = cachedGames.get(dateKey)
    if (cached) return cached

    const [[ava], [board]] = await Promise.all([
        db
            .select({ words: avasWords.words })
            .from(avasWords)
            .where(eq(avasWords.dateKey, dateKey)),
        db
            .select({
                size: boards.size,
                letters: boards.letters,
                time: boards.time,
                totalWords: boards.totalWords,
            })
            .from(boards)
            .where(eq(boards.dateKey, dateKey)),
    ])

    if (!ava || !board) return null

    const game: ArchivedGame = { dateKey, avasWords: ava.words, board }
    cachedGames.set(dateKey, game)

    return game
}

export const load = async ({ params }: RequestEvent) => {
    const game = await getArchivedGame(params.date!)

    if (!game) error(404, "No puzzle found for this date")

    return game
}
