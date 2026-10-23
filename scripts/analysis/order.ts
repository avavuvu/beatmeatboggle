import { wordLengthToPoints } from "../../src/lib/scoring"
import { dataPath, findPath, loadWords, mean, pct, round, share, writeCsv } from "../lib"
import { dedupe, isDailyPlay, loadPlayData, seedWordFor } from "./playData"

await loadWords()
const { boards, avas, byDay } = loadPlayData()
const boardByDate = new Map(boards.map((b) => [b.date_key, b]))

type Transition = "extension" | "contraction" | "anagram" | "overlap" | "hop"

const sortedLetters = (w: string) => [...w].sort().join("")

const classify = (a: string, b: string, pathA: number[] | null, pathB: number[] | null): Transition => {
    if (b.length > a.length && (b.startsWith(a) || b.endsWith(a))) return "extension"
    if (a.length > b.length && (a.startsWith(b) || a.endsWith(b))) return "contraction"
    if (sortedLetters(a) === sortedLetters(b)) return "anagram"
    if (pathA && pathB) {
        const shared = pathA.filter((t) => pathB.includes(t)).length
        if (shared >= Math.min(a.length, b.length) / 2) return "overlap"
    }
    return "hop"
}

const DECILES = 10
const position = { count: new Array(DECILES).fill(0), length: new Array(DECILES).fill(0), long: new Array(DECILES).fill(0) }
const transitions: Record<number, Record<Transition, number>> = {
    4: { extension: 0, contraction: 0, anagram: 0, overlap: 0, hop: 0 },
    5: { extension: 0, contraction: 0, anagram: 0, overlap: 0, hop: 0 },
}
const games = []

for (const [date, rows] of byDay) {
    const board = boardByDate.get(date)
    if (!board || !avas.has(date)) continue
    const valid = new Set(board.total_words)
    const { seedWord } = seedWordFor(board)

    for (const g of dedupe(rows).filter(isDailyPlay)) {
        const words: string[] = []
        for (const w of g.words) if (valid.has(w) && !words.includes(w)) words.push(w)
        if (words.length < 3) continue

        const paths = words.map((w) => findPath(board.letters, board.size, w))
        const n = words.length
        let climbs = 0
        let longestClimb = 1
        let run = 1
        let firstLong = -1
        const kinds: Transition[] = []

        words.forEach((w, i) => {
            const decile = Math.min(DECILES - 1, Math.floor((i / n) * DECILES))
            position.count[decile]++
            position.length[decile] += w.length
            if (w.length >= 6) {
                position.long[decile]++
                if (firstLong < 0) firstLong = i / n
            }
            if (i > 0) {
                const kind = classify(words[i - 1], w, paths[i - 1], paths[i])
                kinds.push(kind)
                transitions[board.size][kind]++
                if (kind === "extension") {
                    climbs++
                    run++
                    longestClimb = Math.max(longestClimb, run)
                } else {
                    run = 1
                }
            }
        })

        const lengths = words.map((w) => w.length)
        const firstHalf = mean(lengths.slice(0, Math.floor(n / 2)))
        const secondHalf = mean(lengths.slice(Math.floor(n / 2)))

        games.push({
            id: g.id,
            date,
            size: board.size,
            words: n,
            score: words.reduce((s, w) => s + wordLengthToPoints(w), 0),
            firstHalfLength: round(firstHalf, 2),
            secondHalfLength: round(secondHalf, 2),
            firstLongAt: firstLong < 0 ? null : round(firstLong, 2),
            hasLong: firstLong >= 0,
            climbs,
            longestClimb,
            climbShare: round(climbs / (n - 1), 3),
            hopShare: round(kinds.filter((k) => k === "hop").length / (n - 1), 3),
            foundSeed: seedWord !== null && words.includes(seedWord),
            seedAt: seedWord !== null && words.includes(seedWord) ? round(words.indexOf(seedWord) / n, 2) : null,
        })

    }
}

writeCsv(
    dataPath("order_position.csv"),
    position.count.map((c, i) => ({
        decile: i,
        words: c,
        meanLength: round(position.length[i] / c, 3),
        longShare: round(position.long[i] / c, 4),
    }))
)

writeCsv(
    dataPath("order_transitions.csv"),
    ([4, 5] as const).flatMap((size) => {
        const total = Object.values(transitions[size]).reduce((a, b) => a + b, 0)
        return (Object.keys(transitions[size]) as Transition[]).map((kind) => ({
            size,
            kind,
            count: transitions[size][kind],
            share: round(transitions[size][kind] / total, 4),
        }))
    })
)

writeCsv(dataPath("order_games.csv"), games)

console.log(`${games.length} games with ≥3 valid words\n`)
console.log("mean word length by position in the game (decile):", position.count.map((c, i) => round(position.length[i] / c, 2)).join("  "))
console.log("share of 6+ words by decile:               ", position.count.map((c, i) => pct(position.long[i] / c)).join("  "))
console.log(`\nfirst half mean length ${round(mean(games.map((g) => g.firstHalfLength)), 2)} vs second half ${round(mean(games.map((g) => g.secondHalfLength)), 2)}`)
console.log(`games with a 6+ word: ${pct(share(games.map((g) => g.hasLong)))}; among them the first one appears at ${pct(mean(games.filter((g) => g.hasLong).map((g) => g.firstLongAt!)))} of the way through`)
const seeded = games.filter((g) => g.foundSeed)
console.log(`games that found the seed word: ${seeded.length}; it was found at ${pct(mean(seeded.map((g) => g.seedAt!)))} of the way through on average`)
console.log("\ntransitions between consecutive words:")
console.table(
    ([4, 5] as const).map((size) => {
        const total = Object.values(transitions[size]).reduce((a, b) => a + b, 0)
        return { size, ...Object.fromEntries(Object.entries(transitions[size]).map(([k, v]) => [k, pct(v / total)])) }
    })
)
console.log(`games with a climb of 3+ consecutive extensions: ${pct(share(games.map((g) => g.longestClimb >= 3)))}; mean climb share per game ${pct(mean(games.map((g) => g.climbShare)))}`)
