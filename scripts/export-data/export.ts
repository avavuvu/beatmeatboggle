import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { avasWords, playerWords } from "../../db/schema"

const DATA_DIR = join(import.meta.dirname, "..", "viz", "data")

const escapeCsvField = (value: unknown): string => {
    if (value === null || value === undefined) return ""

    const str = typeof value === "string" ? value : String(value)

    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
    }

    return str
}

const toCsv = (rows: unknown[][]): string =>
    rows.map((row) => row.map(escapeCsvField).join(",")).join("\n")

async function main() {
    const connectionString = process.env.NETLIFY_DATABASE_URL

    if (!connectionString) {
        throw new Error(
            "Set NETLIFY_DATABASE_URL to a Postgres connection string before running this script"
        )
    }

    const pool = new Pool({ connectionString })
    const db = drizzle(pool)

    const today = new Date().toISOString().slice(0, 10)

    const players = await db
        .select({
            id: playerWords.id,
            dateKey: playerWords.dateKey,
            words: playerWords.words,
            score: playerWords.score,
            fairFight: playerWords.fairFight,
            country: playerWords.country,
            city: playerWords.city,
            createdAt: playerWords.createdAt,
        })
        .from(playerWords)

    const playersRows = players.map((row) => [
        row.id,
        row.dateKey,
        JSON.stringify(row.words),
        row.score,
        row.fairFight ? "1" : "0",
        row.country,
        row.city,
        row.createdAt.getTime(),
    ])

    const playersPath = join(DATA_DIR, `players_${today}.csv`)
    writeFileSync(playersPath, toCsv(playersRows))
    console.log(`Wrote ${playersPath} (${playersRows.length} rows)`)

    const avas = await db
        .select({
            dateKey: avasWords.dateKey,
            words: avasWords.words,
            totalWords: avasWords.totalWords,
        })
        .from(avasWords)

    const avasRows = avas.map((row) => [
        row.dateKey,
        JSON.stringify(row.words),
        row.totalWords ? JSON.stringify(row.totalWords) : "",
    ])

    const avasPath = join(DATA_DIR, `avas_${today}.csv`)
    writeFileSync(avasPath, toCsv(avasRows))
    console.log(`Wrote ${avasPath} (${avasRows.length} rows)`)

    await pool.end()
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
