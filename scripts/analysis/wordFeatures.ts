import { readFileSync } from "node:fs"
import { getAdjacentPositions } from "../../src/lib/constants"
import { wordLengthToPoints } from "../../src/lib/scoring"
import { dataPath, loadWords, readCsv, writeCsv, zipfOf, isPluralOnly } from "../lib"
import { dedupe, diceFor, isDailyPlay, loadPlayData, seedWordFor, WORD_GENERATOR_SINCE } from "./playData"

await loadWords()
const { boards, avas, byDay } = loadPlayData()

const rates = JSON.parse(readFileSync(dataPath("play_word_rates.json"), "utf8")) as Record<string, Record<string, number>>
const days = new Map(readCsv(dataPath("play_days.csv")).map((d) => [d.date as string, d]))

const allPaths = (letters: string[], size: number, word: string): number[][] => {
    const w = word.replace("qu", "q")
    const out: number[][] = []
    const path: number[] = []
    const dfs = (i: number) => {
        if (i === w.length) {
            out.push([...path])
            return
        }
        const cands = i === 0 ? [...Array(letters.length).keys()] : getAdjacentPositions(path[i - 1], size)
        for (const p of cands) {
            if (path.includes(p) || letters[p] !== w[i]) continue
            path.push(p)
            dfs(i + 1)
            path.pop()
        }
    }
    dfs(0)
    return out
}

const turns = (path: number[], size: number) => {
    let t = 0
    for (let i = 2; i < path.length; i++) {
        const d1 = [path[i - 1] % size - path[i - 2] % size, Math.floor(path[i - 1] / size) - Math.floor(path[i - 2] / size)]
        const d2 = [path[i] % size - path[i - 1] % size, Math.floor(path[i] / size) - Math.floor(path[i - 1] / size)]
        if (d1[0] !== d2[0] || d1[1] !== d2[1]) t++
    }
    return t
}

const isEdge = (tile: number, size: number) => {
    const x = tile % size
    const y = Math.floor(tile / size)
    return x === 0 || y === 0 || x === size - 1 || y === size - 1
}

const rows = []

for (const b of boards) {
    const date = b.date_key
    const day = days.get(date)
    const dayRates = rates[date]
    if (!day || !dayRates || !avas.has(date)) continue

    const players = dedupe(byDay.get(date) ?? []).filter(isDailyPlay).length
    if (players < 100) continue

    const total = new Set(b.total_words)
    const avaSet = new Set(avas.get(date))
    const { seedWord } = seedWordFor(b)

    for (const word of b.total_words) {
        const paths = allPaths(b.letters, b.size, word)
        if (!paths.length) continue
        const straightest = Math.min(...paths.map((p) => turns(p, b.size)))
        const hasLonger = b.total_words.some((o) => o.length > word.length && (o.startsWith(word) || o.endsWith(word)))
        const hasShorter = b.total_words.some((o) => o.length < word.length && o.length >= 3 && (word.startsWith(o) || word.endsWith(o)))

        rows.push({
            date,
            size: b.size,
            era: date >= WORD_GENERATOR_SINCE ? "word" : "before",
            dice: diceFor(date),
            word,
            length: word.length,
            points: wordLengthToPoints(word),
            zipf: zipfOf(word),
            plural: isPluralOnly(word),
            hasLonger,
            hasShorter,
            isSeed: word === seedWord,
            avaFound: avaSet.has(word),
            pathCount: paths.length,
            minTurns: straightest,
            startsOnEdge: paths.every((p) => isEdge(p[0], b.size)),
            players,
            rate: dayRates[word] ?? 0,
        })
    }
}

writeCsv(dataPath("word_features.csv"), rows)
console.log(`wrote ${rows.length} (day, word) rows across ${new Set(rows.map((r) => r.date)).size} days`)
