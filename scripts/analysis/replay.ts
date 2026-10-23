import { writeFileSync } from "node:fs"
import { loadDirtyWordsFromDisk } from "../../src/lib/server/dictionary"
import { scoreWord } from "../../src/lib/scoring"
import { dataPath, findPath, loadWords } from "../lib"
import { dedupe, isDailyPlay, loadPlayData, seedWordFor } from "./playData"

await loadWords()
await loadDirtyWordsFromDisk()
const { boards, avas, byDay } = loadPlayData()
const boardByDate = new Map(boards.map((b) => [b.date_key, b]))

const dates = process.argv.slice(2)
if (!dates.length) {
    console.error("usage: bun run scripts/analysis/replay.ts <date> [date...]")
    process.exit(1)
}

for (const date of dates) {
    const board = boardByDate.get(date)
    const avasWords = avas.get(date)
    if (!board || !avasWords) {
        console.error(`${date}: no board or no ava words`)
        continue
    }
    const valid = new Set(board.total_words)
    const { seedWord } = seedWordFor(board)

    const games = dedupe(byDay.get(date) ?? [])
        .filter(isDailyPlay)
        .map((g) => {
            const words: string[] = []
            for (const w of g.words) if (valid.has(w) && !words.includes(w)) words.push(w)
            return { id: g.id, words }
        })
        .filter((g) => g.words.length >= 3)
        .sort((a, b) => b.words.length - a.words.length)

    if (!games.length) {
        console.error(`${date}: no games`)
        continue
    }

    const match = { opponentWords: avasWords, fairFight: false, seedWord, boardDate: date }
    const pack = (game: { id: number; words: string[] }) => ({
        date,
        id: game.id,
        size: board.size,
        letters: board.letters.join(""),
        seedWord,
        avasWords,
        words: game.words,
        paths: game.words.map((word) => findPath(board.letters, board.size, word)),
        scores: game.words.map((word) => scoreWord({ word, match }).breakdown),
    })

    const out = { top: pack(games[0]), median: pack(games[Math.floor(games.length / 2)]) }
    writeFileSync(dataPath(`replay_${date}.json`), JSON.stringify(out, null, 2))
    console.log(`${date}: ${games.length} games, top ${out.top.words.length} words (#${out.top.id}), median ${out.median.words.length} → scripts/data/replay_${date}.json`)
}
