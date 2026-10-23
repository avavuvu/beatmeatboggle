import { writeFileSync } from "node:fs"
import { dataPath, readOnlyDb } from "../lib"

const sql = readOnlyDb()
const since = process.argv[2] ?? "2026-09-11"

const counts = await sql`
    select
        (select count(*) from boards) as boards,
        (select count(*) from avas_words) as avas_words,
        (select count(*) from player_words) as player_words,
        (select count(*) from player_words where date_key >= ${since}) as player_words_since,
        (select min(date_key) from boards) as first_board,
        (select max(date_key) from boards) as last_board
`
console.table(counts)

const boards = await sql`
    select date_key, size, letters, time, total_words, (extract(epoch from created_at) * 1000)::bigint::float8 as created_ms
    from boards where date_key >= ${since} order by date_key
`
const avas = await sql`
    select date_key, words from avas_words where date_key >= ${since} order by date_key
`
const players = await sql`
    select id, date_key, words, score, fair_fight, country, city, (extract(epoch from created_at) * 1000)::bigint::float8 as created_ms,
        challenged_by, player_id
    from player_words where date_key >= ${since} order by date_key, created_at
`

writeFileSync(dataPath("play_boards.json"), JSON.stringify(boards, null, 2))
writeFileSync(dataPath("play_avas.json"), JSON.stringify(avas, null, 2))
writeFileSync(dataPath("play_players.json"), JSON.stringify(players))

console.log(`since ${since}: ${boards.length} boards, ${avas.length} ava days, ${players.length} player rows`)
