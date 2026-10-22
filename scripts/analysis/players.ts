import { loadDirtyWordsFromDisk } from "../../src/lib/server/dictionary"
import { calculateTotalPoints } from "../../src/lib/scoring"
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
    avaRows.push({ dateKey: date, words: JSON.stringify(words), score: calculateTotalPoints(words, [], false, false) })
}

for (const [date, games] of byDay) {
    if (until && date > until) continue
    const avaWords = avas.get(date)
    const valid = boardWords.get(date)
    if (!avaWords || !valid) continue

    const seen = new Set<string>()
    for (const g of dedupe(games)) {
        const key = g.words.join(",")
        if (seen.has(key)) continue
        seen.add(key)

        const words = g.words.filter((w) => valid.has(w))
        const score = calculateTotalPoints(words, avaWords, true, g.fair_fight, true)
        const avaScore = calculateTotalPoints(avaWords, words, g.fair_fight, g.fair_fight, true)
        const avaScoreFair = calculateTotalPoints(avaWords, words, true, true, true)

        rows.push({
            id: g.id,
            dateKey: date,
            weekday: weekdayFor(date),
            createdAt: Math.round(g.created_ms),
            country: g.country,
            city: g.city,
            fairFight: g.fair_fight,
            wordCount: words.length,
            longest: words.reduce((a, w) => Math.max(a, w.length), 0),
            score,
            avaScore,
            beatAva: score > avaScore,
            beatAvaFair: calculateTotalPoints(words, avaWords, true, true, true) > avaScoreFair,
            words: JSON.stringify(words),
        })
    }
}

writeCsv(dataPath(`players${suffix}.csv`), rows)
writeCsv(dataPath(`avas${suffix}.csv`), avaRows)
console.log(`wrote ${rows.length} games across ${new Set(rows.map((r) => r.dateKey)).size} days${until ? ` up to ${until}` : ""}, ${avaRows.length} ava days`)
