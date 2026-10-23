import { loadDirtyWordsFromDisk } from "../../src/lib/server/dictionary"
import { scoreOpponent, scorePlayer, scoreSolo } from "../../src/lib/scoring"
import { dataPath, loadWords, writeCsv } from "../lib"
import { dedupe, loadPlayData, weekdayFor } from "./playData"

await loadWords()
await loadDirtyWordsFromDisk()

const untilArg = process.argv.indexOf("--until")
const until = untilArg >= 0 ? process.argv[untilArg + 1] : null
const suffix = until ? `_${until}` : ""

const { boards, avas, byDay } = loadPlayData()
const boardWords = new Map(boards.map((b) => [b.date_key, new Set(b.total_words)]))

const rows = []
const avaRows = []

for (const [date, words] of avas) {
    if (until && date > until) continue
    avaRows.push({ dateKey: date, words: JSON.stringify(words), score: scoreSolo({ words, board: { seedWord: null, boardDate: date } }) })
}

for (const [date, games] of byDay) {
    if (until && date > until) continue
    const avaWords = avas.get(date)
    const valid = boardWords.get(date)
    if (!avaWords || !valid) continue

    const seen = new Set<string>()
    for (const game of dedupe(games)) {
        const key = game.words.join(",")
        if (seen.has(key)) continue
        seen.add(key)

        const words = game.words.filter((word) => valid.has(word))
        const fairFight = game.fair_fight
        const match = { opponentWords: avaWords, fairFight, seedWord: null, boardDate: date }
        const fairMatch = { ...match, fairFight: true }
        const score = scorePlayer({ words, match })
        const avaScore = scoreOpponent({ playerWords: words, match })
        const scoreFair = scorePlayer({ words, match: fairMatch })
        const avaScoreFair = scoreOpponent({ playerWords: words, match: fairMatch })

        rows.push({
            id: game.id,
            dateKey: date,
            weekday: weekdayFor(date),
            createdAt: Math.round(game.created_ms),
            country: game.country,
            city: game.city,
            fairFight,
            wordCount: words.length,
            longest: words.reduce((longest, word) => Math.max(longest, word.length), 0),
            score,
            avaScore,
            beatAva: score > avaScore,
            beatAvaFair: scoreFair > avaScoreFair,
            words: JSON.stringify(words),
        })
    }
}

writeCsv(dataPath(`players${suffix}.csv`), rows)
writeCsv(dataPath(`avas${suffix}.csv`), avaRows)
console.log(`wrote ${rows.length} games across ${new Set(rows.map((r) => r.dateKey)).size} days${until ? ` up to ${until}` : ""}, ${avaRows.length} ava days`)
