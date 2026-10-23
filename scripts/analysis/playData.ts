import { readFileSync } from "node:fs"
import { weekDayMap, WEEKDAYS, type Dice } from "../../src/lib/board"
import { dateFromKey } from "../../src/lib/constants"

import { getGameDateKey } from "../../src/lib/server/gameDate"
import { allWords, DATA_DIR, generateClassicLegacy, generateWithWordLegacy, pick, rngFrom, PRODUCTION_LENGTHS } from "../lib"

export type BoardRow = {
    date_key: string
    size: number
    letters: string[]
    time: number
    total_words: string[]
    created_ms: number
}

export type AvaRow = { date_key: string; words: string[] }

export type PlayerRow = {
    id: number
    date_key: string
    words: string[]
    score: number
    fair_fight: boolean
    country: string | null
    city: string | null
    created_ms: number
    challenged_by: string | null
    player_id: string | null
}

const read = <T,>(name: string) => JSON.parse(readFileSync(`${DATA_DIR}/${name}`, "utf8")) as T

export const loadPlayData = () => {
    const boards = read<BoardRow[]>("play_boards.json")
    const avas = new Map(read<AvaRow[]>("play_avas.json").map((r) => [r.date_key, r.words]))
    const players = read<PlayerRow[]>("play_players.json")

    const byDay = new Map<string, PlayerRow[]>()
    for (const p of players) {
        if (!byDay.has(p.date_key)) byDay.set(p.date_key, [])
        byDay.get(p.date_key)!.push(p)
    }

    return { boards, avas, players, byDay }
}

export const playedOn = (row: PlayerRow) => getGameDateKey(new Date(row.created_ms))

export const isDailyPlay = (row: PlayerRow) => !row.challenged_by && playedOn(row) === row.date_key

export const BACKFILL_MS = Date.UTC(2026, 5, 4, 12, 1, 57, 918)
export const isBackfilled = (row: PlayerRow) => Math.abs(row.created_ms - BACKFILL_MS) < 1000

export const PLAYER_IDS_SINCE = "2026-07-31"

export const dedupe = (rows: PlayerRow[]) => {
    const seen = new Set<string>()
    const out: PlayerRow[] = []
    for (const r of rows) {
        if (r.challenged_by) continue
        if (r.player_id) {
            if (seen.has(r.player_id)) continue
            seen.add(r.player_id)
        }
        out.push(r)
    }
    return out
}

export const weekdayFor = (dateKey: string) => WEEKDAYS[dateFromKey(dateKey).getUTCDay()]

export const WORD_GENERATOR_SINCE = "2026-09-11"

export type HistoricalDice = Dice | "clusters"

export const diceFor = (dateKey: string): HistoricalDice => {
    const weekday = weekdayFor(dateKey)
    if (dateKey >= WORD_GENERATOR_SINCE) return weekDayMap[weekday].dice
    return weekday === "Monday" || weekday === "Tuesday" ? "classic" : "clusters"
}

export const productionSeedWord = (dateKey: string) => {
    const pool = allWords().filter((w) => w.length >= PRODUCTION_LENGTHS[0] && w.length <= PRODUCTION_LENGTHS[1])
    return pick(rngFrom(dateKey), pool)
}

export const originalBoard = (dateKey: string, size: number): string | null => {
    const dice = diceFor(dateKey)
    if (dice === "clusters") return null
    return (dice === "classic" ? generateClassicLegacy : generateWithWordLegacy)(dateKey, size).join("")
}

export const inferSeedWord = (totalWords: string[]) =>
    totalWords
        .filter((w) => w.length >= PRODUCTION_LENGTHS[0] && w.length <= PRODUCTION_LENGTHS[1])
        .sort((a, b) => b.length - a.length)[0] ?? null

export const seedWordFor = (board: BoardRow): { seedWord: string | null; rerolled: boolean | null } => {
    if (diceFor(board.date_key) !== "word") return { seedWord: null, rerolled: null }
    const rerolled = originalBoard(board.date_key, board.size) !== board.letters.join("")
    return { seedWord: rerolled ? inferSeedWord(board.total_words) : productionSeedWord(board.date_key), rerolled }
}
