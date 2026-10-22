import type { PlayMode } from "../../../db/schema"
import { isValidDateKey } from "../dates"

const ID = /^[0-9a-f]{12}$/

export class PlayError extends Error {
    constructor(
        message: string,
        public status: number
    ) {
        super(message)
    }
}

export type PlaySubmission = {
    dateKey: unknown
    words: unknown
    fairFight: unknown
    playerId: unknown
    challengedBy: unknown
}

export type ValidPlay = {
    dateKey: string
    words: string[]
    fairFight: boolean
    playerId: string | null
    challengedBy: string | null
    mode: PlayMode
}

export const validatePlay = (body: PlaySubmission, today: string, boardWords: Iterable<string>): ValidPlay => {
    const { dateKey, fairFight, playerId, challengedBy } = body

    if (typeof dateKey !== "string" || !isValidDateKey(dateKey)) throw new PlayError("Invalid dateKey", 400)
    if (dateKey > today) throw new PlayError("Board not available yet", 400)
    if (!Array.isArray(body.words) || body.words.length > 2000) throw new PlayError("Invalid words", 400)
    if (playerId !== null && playerId !== undefined && (typeof playerId !== "string" || !ID.test(playerId))) throw new PlayError("Invalid playerId", 400)
    if (challengedBy !== null && challengedBy !== undefined && (typeof challengedBy !== "string" || !ID.test(challengedBy))) throw new PlayError("Invalid challengedBy", 400)

    const valid = new Set(boardWords)
    return {
        dateKey,
        words: [...new Set(body.words.filter((w): w is string => typeof w === "string" && valid.has(w)))],
        fairFight: fairFight === true,
        playerId: typeof playerId === "string" ? playerId : null,
        challengedBy: typeof challengedBy === "string" ? challengedBy : null,
        mode: challengedBy ? "challenge" : dateKey === today ? "daily" : "archive",
    }
}
