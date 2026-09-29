import { sql } from "drizzle-orm"
import { db } from "../../../db"
import { boards, playerWords } from "../../../db/schema"
import type { WordStat } from "../statsTypes"

export type DayWordStats = {
    players: number
    words: WordStat[]
}

export const getDayWordStats = async (dateKey: string): Promise<DayWordStats> => {
    const { rows } = await db.execute<{ word: string; plays: number; players: number }>(sql`
        with players as (
            select count(*)::int as total
            from ${playerWords}
            where ${playerWords.dateKey} = ${dateKey}
        ),
        plays as (
            select w.word, count(*)::int as plays
            from ${playerWords}
            cross join lateral jsonb_array_elements_text(${playerWords.words}) as w(word)
            where ${playerWords.dateKey} = ${dateKey}
            group by w.word
        )
        select t.word, coalesce(p.plays, 0)::int as plays, players.total as players
        from ${boards}
        cross join lateral jsonb_array_elements_text(${boards.totalWords}) as t(word)
        cross join players
        left join plays p on p.word = t.word
        where ${boards.dateKey} = ${dateKey}
        order by plays desc, t.word
    `)

    const players = rows[0]?.players ?? 0

    return {
        players,
        words: rows.map(({ word, plays }) => ({
            word,
            plays,
            percentage: players > 0 ? (plays / players) * 100 : 0,
        })),
    }
}
