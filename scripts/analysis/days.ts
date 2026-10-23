import { writeFileSync } from "node:fs"
import { wordLengthToPoints } from "../../src/lib/scoring"
import { dataPath, evaluate, loadWords, mean, median, pct, quantile, share, writeCsv } from "../lib"
import { dedupe, diceFor, loadPlayData, seedWordFor, weekdayFor } from "./playData"

await loadWords()
const { boards, avas, byDay } = loadPlayData()

const days = []
const wordRates: Record<string, Record<string, number>> = {}

for (const b of boards) {
    const date = b.date_key
    const { seedWord, rerolled } = seedWordFor(b)
    const m = evaluate(b.letters, b.size, seedWord)

    const rows = dedupe(byDay.get(date) ?? [])
    const avaWords = avas.get(date) ?? []
    const avaSet = new Set(avaWords)
    const avaScore = avaWords.reduce((s, w) => s + wordLengthToPoints(w), 0)
    const boardWords = new Set(b.total_words)

    const found = new Map<string, number>()
    const perPlayer = rows.map((r) => {
        const valid = r.words.filter((w) => boardWords.has(w))
        for (const w of new Set(valid)) found.set(w, (found.get(w) ?? 0) + 1)
        const score = valid.reduce((s, w) => s + wordLengthToPoints(w) + (avaSet.has(w) ? 0 : 1), 0)
        return {
            words: valid.length,
            score,
            longest: valid.reduce((a, w) => Math.max(a, w.length), 0),
            has6: valid.some((w) => w.length >= 6),
            has7: valid.some((w) => w.length >= 7),
            foundSeed: seedWord !== null && valid.includes(seedWord),
            beatAva: score > avaScore,
        }
    })

    const n = perPlayer.length
    const rate = (w: string) => (found.get(w) ?? 0) / Math.max(n, 1)
    wordRates[date] = Object.fromEntries(b.total_words.map((w) => [w, rate(w)]))

    days.push({
        date,
        weekday: weekdayFor(date),
        dice: diceFor(date),
        size: b.size,
        letters: b.letters.join(""),
        rerolled,
        seedWord,
        seedInflection: m.seedInflection,
        players: n,
        avaWords: avaWords.length,
        avaScore,
        medianWords: median(perPlayer.map((p) => p.words)),
        meanWords: mean(perPlayer.map((p) => p.words)),
        medianScore: median(perPlayer.map((p) => p.score)),
        meanScore: mean(perPlayer.map((p) => p.score)),
        p90Words: quantile(perPlayer.map((p) => p.words), 0.9),
        beatAva: share(perPlayer.map((p) => p.beatAva)),
        has6: share(perPlayer.map((p) => p.has6)),
        has7: share(perPlayer.map((p) => p.has7)),
        meanLongest: mean(perPlayer.map((p) => p.longest)),
        foundSeed: seedWord ? share(perPlayer.map((p) => p.foundSeed)) : null,
        findableByOnePct: b.total_words.filter((w) => rate(w) >= 0.01).length,
        findableByFivePct: b.total_words.filter((w) => rate(w) >= 0.05).length,
        longFoundByOnePct: b.total_words.filter((w) => w.length >= 6 && rate(w) >= 0.01).length,
        totalWords: b.total_words.length,
        words: m.words,
        len6plus: m.len6plus,
        len7plus: m.len7plus,
        len3Share: m.len3 / m.words,
        pluralShare: m.plurals / m.words,
        vowels: m.vowels,
        vowelShare: m.vowels / (b.size * b.size),
        distinct: m.distinct,
        hubShare: m.hubShare,
        weakTiles: m.weakTiles,
        eeoo: m.adjEE + m.adjOO,
        rare: m.rare,
        e: m.e,
        s: m.s,
    })
}

writeCsv(dataPath("play_days.csv"), days)
writeFileSync(dataPath("play_word_rates.json"), JSON.stringify(wordRates))

console.table(
    days.map((d) => ({
        date: d.date,
        day: d.weekday.slice(0, 3),
        size: d.size,
        rerolled: d.rerolled ?? "-",
        seed: d.seedWord ?? "-",
        players: d.players,
        "med words": d.medianWords,
        "med score": d.medianScore,
        "beat ava": pct(d.beatAva),
        "has 6+": pct(d.has6),
        "found seed": d.foundSeed === null ? "-" : pct(d.foundSeed, 1),
        "board words": d.words,
        "≥1% find": d.findableByOnePct,
        "6+ ≥1%": `${d.longFoundByOnePct}/${d.len6plus}`,
    }))
)
console.log(`wrote ${days.length} days to scripts/data/play_days.csv`)
