import { loadDirtyWordsFromDisk } from "../../src/lib/server/dictionary"
import { scorePlayer, wordLengthToPoints } from "../../src/lib/scoring"
import { dataPath, loadWords, pct, quantile, share, writeCsv } from "../lib"
import { isBackfilled, loadPlayData, PLAYER_IDS_SINCE } from "./playData"

await loadWords()
await loadDirtyWordsFromDisk()
const { boards, avas, players } = loadPlayData()
const boardWords = new Map(boards.map((b) => [b.date_key, new Set(b.total_words)]))
const maxScore = new Map(boards.map((b) => [b.date_key, b.total_words.reduce((s, w) => s + wordLengthToPoints(w), 0)]))

type Verdict =
    | "match"
    | "ava-missing-bonus"
    | "invalid-words"
    | "impossible"
    | "client-high"
    | "client-low"

type Row = {
    id: number
    date: string
    era: "early" | "recent"
    challenge: boolean
    clientScore: number
    recomputed: number
    delta: number
    invalidWords: number
    submittedWords: number
    verdict: Verdict
}

const rows: Row[] = []

for (const game of players) {
    if (isBackfilled(game) && game.score === -1) continue
    const valid = boardWords.get(game.date_key)
    const avaWords = avas.get(game.date_key)
    if (!valid || !avaWords) continue

    const onBoard = game.words.filter((word) => valid.has(word))
    const invalid = game.words.length - onBoard.length
    const fairFight = game.fair_fight
    const match = { opponentWords: avaWords, fairFight, seedWord: null, boardDate: game.date_key }
    const recomputed = scorePlayer({ words: onBoard, match })
    const everyWordBonused = scorePlayer({ words: game.words, match: { ...match, opponentWords: [] } })
    const delta = game.score - recomputed

    let verdict: Verdict = "match"
    if (delta !== 0) {
        if (game.score > maxScore.get(game.date_key)!) verdict = "impossible"
        else if (invalid > 0) verdict = "invalid-words"
        else if (game.score === everyWordBonused) verdict = "ava-missing-bonus"
        else verdict = delta > 0 ? "client-high" : "client-low"
    } else if (invalid > 0) {
        verdict = "invalid-words"
    }

    rows.push({
        id: game.id,
        date: game.date_key,
        era: game.date_key >= PLAYER_IDS_SINCE ? "recent" : "early",
        challenge: !!game.challenged_by,
        clientScore: game.score,
        recomputed,
        delta,
        invalidWords: invalid,
        submittedWords: game.words.length,
        verdict,
    })
}

writeCsv(dataPath("score_check.csv"), rows)

const summarise = (label: string, rs: Row[]) => {
    const counts: Record<string, number> = {}
    for (const r of rs) counts[r.verdict] = (counts[r.verdict] ?? 0) + 1
    return {
        rows: label,
        n: rs.length,
        ...Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, `${v} (${pct(v / rs.length, 1)})`])),
    }
}

console.table([
    summarise("all", rows),
    summarise("early (before player ids)", rows.filter((r) => r.era === "early")),
    summarise("recent", rows.filter((r) => r.era === "recent")),
    summarise("challenge games", rows.filter((r) => r.challenge)),
])

const off = rows.filter((r) => r.verdict !== "match")
const high = rows.filter((r) => r.delta > 0 && r.verdict !== "ava-missing-bonus")
console.log(`\nclient score higher than recomputed (excluding the missing-bonus bug): ${high.length} rows (${pct(high.length / rows.length, 2)})`)
console.log(`  delta quantiles among them: p50 ${quantile(high.map((r) => r.delta), 0.5)}, p90 ${quantile(high.map((r) => r.delta), 0.9)}, max ${high.reduce((m, r) => Math.max(m, r.delta), 0)}`)
console.log(`  with invalid words: ${share(high.map((r) => r.invalidWords > 0)) * 100 | 0}%`)
console.log(`\nimpossible scores (above the board maximum): ${rows.filter((r) => r.verdict === "impossible").length}`)
console.log("  worst:", rows.filter((r) => r.verdict === "impossible").sort((a, b) => b.delta - a.delta).slice(0, 5).map((r) => `${r.date} #${r.id} sent ${r.clientScore} vs ${r.recomputed} (${r.invalidWords} invalid of ${r.submittedWords})`).join("; "))
console.log(`\nrows with any invalid word: ${rows.filter((r) => r.invalidWords > 0).length}; max invalid words in one row: ${rows.reduce((m, r) => Math.max(m, r.invalidWords), 0)}`)
const invalidByDay: Record<string, number> = {}
for (const r of rows) if (r.invalidWords > 0) invalidByDay[r.date] = (invalidByDay[r.date] ?? 0) + 1
console.log("  days with most invalid-word rows:", Object.entries(invalidByDay).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([d, n]) => `${d}:${n}`).join(" "))
console.log(`\nmissing-bonus bug (ava's words not loaded): ${rows.filter((r) => r.verdict === "ava-missing-bonus").length} rows on ${new Set(rows.filter((r) => r.verdict === "ava-missing-bonus").map((r) => r.date)).size} days`)
console.log(`${off.length} of ${rows.length} rows (${pct(off.length / rows.length, 1)}) have a stored score that isn't what the words are worth`)
