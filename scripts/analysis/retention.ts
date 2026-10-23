import { loadDirtyWordsFromDisk } from "../../src/lib/server/dictionary"
import { scoreOpponent, scorePlayer } from "../../src/lib/scoring"
import { dataPath, loadWords, mean, pct, readCsv, round, share, spearman, writeCsv } from "../lib"
import { isDailyPlay, loadPlayData, PLAYER_IDS_SINCE, weekdayFor, type PlayerRow } from "./playData"

await loadWords()
await loadDirtyWordsFromDisk()
const { boards, avas, players } = loadPlayData()
const boardWords = new Map(boards.map((b) => [b.date_key, new Set(b.total_words)]))
const dayMetrics = new Map(readCsv(dataPath("play_days.csv")).map((d) => [d.date as string, d]))

const addDays = (date: string, n: number) => {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + n)
    return d.toISOString().slice(0, 10)
}

type Play = { playerId: string; date: string; score: number; avaScore: number; beatAva: boolean; words: number }
const plays: Play[] = []
const seen = new Set<string>()

for (const game of players) {
    if (!game.player_id || game.date_key < PLAYER_IDS_SINCE || !isDailyPlay(game)) continue
    const key = `${game.player_id}|${game.date_key}`
    if (seen.has(key)) continue
    const valid = boardWords.get(game.date_key)
    const avaWords = avas.get(game.date_key)
    if (!valid || !avaWords) continue
    seen.add(key)
    const words = game.words.filter((word) => valid.has(word))
    const fairFight = game.fair_fight
    const match = { opponentWords: avaWords, fairFight, seedWord: null, boardDate: game.date_key }
    const score = scorePlayer({ words, match })
    const avaScore = scoreOpponent({ playerWords: words, match })
    plays.push({ playerId: game.player_id, date: game.date_key, score, avaScore, beatAva: score > avaScore, words: words.length })
}

const LAST = plays.reduce((m, p) => (p.date > m ? p.date : m), "")
const byPlayer = new Map<string, Play[]>()
for (const p of plays) (byPlayer.get(p.playerId) ?? byPlayer.set(p.playerId, []).get(p.playerId)!).push(p)
for (const list of byPlayer.values()) list.sort((a, b) => a.date.localeCompare(b.date))

const firstSeen = new Map([...byPlayer].map(([id, list]) => [id, list[0].date]))
const playedOn = new Map<string, Set<string>>()
for (const p of plays) (playedOn.get(p.playerId) ?? playedOn.set(p.playerId, new Set()).get(p.playerId)!).add(p.date)

const KNOWN_NEW_FROM = addDays(PLAYER_IDS_SINCE, 7)
const isNew = (p: Play) => firstSeen.get(p.playerId) === p.date && p.date >= KNOWN_NEW_FROM

const byDate = new Map<string, Play[]>()
for (const p of plays) (byDate.get(p.date) ?? byDate.set(p.date, []).get(p.date)!).push(p)
const percentile = new Map<Play, number>()
for (const list of byDate.values()) {
    const sorted = [...list].sort((a, b) => a.score - b.score)
    sorted.forEach((p, i) => percentile.set(p, i / Math.max(sorted.length - 1, 1)))
}

const dayRows = [...byDate]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([date]) => date < LAST)
    .map(([date, list]) => {
        const m = dayMetrics.get(date)
        const returned = list.filter((p) => playedOn.get(p.playerId)!.has(addDays(date, 1)))
        const regulars = list.filter((p) => byPlayer.get(p.playerId)!.filter((q) => q.date < date).length >= 5)
        const regularsReturned = regulars.filter((p) => playedOn.get(p.playerId)!.has(addDays(date, 1)))
        return {
            date,
            weekday: weekdayFor(date),
            dice: m?.dice ?? null,
            size: m?.size ?? null,
            players: list.length,
            new: list.filter(isNew).length,
            returning: list.filter((p) => firstSeen.get(p.playerId) !== p.date).length,
            unknownAge: list.filter((p) => firstSeen.get(p.playerId) === p.date && p.date < KNOWN_NEW_FROM).length,
            returnRate: round(returned.length / list.length, 4),
            regulars: regulars.length,
            regularReturnRate: regulars.length ? round(regularsReturned.length / regulars.length, 4) : null,
            beatAva: round(share(list.map((p) => p.beatAva)), 4),
            medianWords: [...list.map((p) => p.words)].sort((a, b) => a - b)[Math.floor(list.length / 2)],
            boardWords: m?.words ?? null,
            len6plus: m?.len6plus ?? null,
            len3Share: m?.len3Share ?? null,
            seedWord: m?.seedWord ?? null,
        }
    })

writeCsv(dataPath("retention_days.csv"), dayRows)

const HORIZONS = [1, 2, 3, 7, 14, 30]
const cohortRows = []
const weekOf = (date: string) => {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
    return d.toISOString().slice(0, 10)
}
const cohorts = new Map<string, string[]>()
for (const [id, first] of firstSeen) {
    if (first < KNOWN_NEW_FROM) continue
    ;(cohorts.get(weekOf(first)) ?? cohorts.set(weekOf(first), []).get(weekOf(first))!).push(id)
}
for (const [week, ids] of [...cohorts].sort(([a], [b]) => a.localeCompare(b))) {
    const row: Record<string, string | number | null> = { cohortWeek: week, players: ids.length }
    for (const n of HORIZONS) {
        const eligible = ids.filter((id) => addDays(firstSeen.get(id)!, n) <= LAST)
        row[`day${n}`] = eligible.length >= 50 ? round(share(eligible.map((id) => playedOn.get(id)!.has(addDays(firstSeen.get(id)!, n)))), 4) : null
        row[`day${n}any`] =
            eligible.length >= 50
                ? round(share(eligible.map((id) => [...playedOn.get(id)!].some((d) => d > firstSeen.get(id)! && d <= addDays(firstSeen.get(id)!, n)))), 4)
                : null
    }
    cohortRows.push(row)
}
writeCsv(dataPath("retention_cohorts.csv"), cohortRows)

const experience = (p: Play) => {
    const prior = byPlayer.get(p.playerId)!.filter((q) => q.date < p.date).length
    return prior === 0 ? "1st game" : prior < 3 ? "2nd–3rd" : prior < 10 ? "4th–10th" : "11th+"
}
const ratioBucket = (p: Play) => {
    const r = p.avaScore ? p.score / p.avaScore : 0
    return r < 0.25 ? "< 25% of ava" : r < 0.5 ? "25–50%" : r < 0.75 ? "50–75%" : r < 1 ? "75–100%" : r < 1.5 ? "beat ava" : "crushed ava"
}
const outcomeRows = []
const eligible = plays.filter((p) => p.date < LAST && !(firstSeen.get(p.playerId) === p.date && p.date < KNOWN_NEW_FROM))
for (const exp of ["1st game", "2nd–3rd", "4th–10th", "11th+"]) {
    for (const bucket of ["< 25% of ava", "25–50%", "50–75%", "75–100%", "beat ava", "crushed ava"]) {
        const s = eligible.filter((p) => experience(p) === exp && ratioBucket(p) === bucket)
        if (s.length < 30) continue
        outcomeRows.push({
            experience: exp,
            result: bucket,
            plays: s.length,
            returnRate: round(share(s.map((p) => playedOn.get(p.playerId)!.has(addDays(p.date, 1)))), 4),
            returnWithinWeek: round(share(s.map((p) => [...playedOn.get(p.playerId)!].some((d) => d > p.date && d <= addDays(p.date, 7)))), 4),
        })
    }
}
writeCsv(dataPath("retention_outcome.csv"), outcomeRows)

const learningRows = []
const regulars = [...byPlayer.values()].filter((list) => list.length >= 20)
for (let n = 0; n < 40; n++) {
    const ps = regulars.map((list) => list[n]).filter((p): p is Play => !!p)
    if (ps.length < 50) break
    learningRows.push({
        game: n + 1,
        players: ps.length,
        meanPercentile: round(mean(ps.map((p) => percentile.get(p)!)), 4),
        beatAva: round(share(ps.map((p) => p.beatAva)), 4),
        meanWords: round(mean(ps.map((p) => p.words)), 2),
    })
}
writeCsv(dataPath("retention_learning.csv"), learningRows)

const streaks: number[] = []
for (const dates of playedOn.values()) {
    const sorted = [...dates].sort()
    let run = 1
    let best = 1
    for (let i = 1; i < sorted.length; i++) {
        run = sorted[i] === addDays(sorted[i - 1], 1) ? run + 1 : 1
        best = Math.max(best, run)
    }
    streaks.push(best)
}
const streakHist: Record<string, number> = {}
for (const s of streaks) {
    const k = s === 1 ? "1" : s <= 3 ? "2–3" : s <= 7 ? "4–7" : s <= 14 ? "8–14" : s <= 30 ? "15–30" : "31+"
    streakHist[k] = (streakHist[k] ?? 0) + 1
}
writeCsv(
    dataPath("retention_streaks.csv"),
    ["1", "2–3", "4–7", "8–14", "15–30", "31+"].map((k) => ({ longestStreak: k, players: streakHist[k] ?? 0, share: round((streakHist[k] ?? 0) / streaks.length, 4) }))
)

console.log(`${plays.length.toLocaleString()} daily plays by ${byPlayer.size.toLocaleString()} browsers, ${PLAYER_IDS_SINCE} → ${LAST}`)
console.log(`longest streak: ${Object.entries(streakHist).map(([k, v]) => `${k}: ${pct(v / streaks.length)}`).join("  ")}`)
console.log("\nday-N retention by cohort week (fraction of new players who play exactly N days later / at any point within N days):")
console.table(cohortRows.map((r) => ({ week: r.cohortWeek, n: r.players, d1: r.day1, d3: r.day3, d7: r.day7, "≤7": r.day7any, d14: r.day14, d30: r.day30, "≤30": r.day30any })))
console.log("\nnext-day return by result and experience:")
console.table(outcomeRows.map((r) => ({ ...r, returnRate: pct(r.returnRate), returnWithinWeek: pct(r.returnWithinWeek) })))
console.log("\nscore percentile by nth game (players with 20+ games):", learningRows.filter((r) => [1, 2, 3, 5, 10, 20, 30].includes(r.game)).map((r) => `#${r.game}: ${pct(r.meanPercentile)}`).join("  "))

const withMetrics = dayRows.filter((d) => d.boardWords !== null && d.regularReturnRate !== null)
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
console.log("\nmean regular (5+ prior games) return rate by weekday:", WEEKDAYS.map((w) => `${w.slice(0, 3)} ${pct(mean(withMetrics.filter((d) => d.weekday === w).map((d) => Number(d.regularReturnRate))))}`).join("  "))

const weekdayMean = (key: "returnRate" | "regularReturnRate", w: string) => mean(withMetrics.filter((d) => d.weekday === w).map((d) => Number(d[key])))
const residual = withMetrics.map((d) => ({
    ...d,
    returnResid: Number(d.returnRate) - weekdayMean("returnRate", d.weekday),
    regularResid: Number(d.regularReturnRate) - weekdayMean("regularReturnRate", d.weekday),
}))
const four = residual.filter((d) => d.size === 4)
const num = (rows: typeof residual, k: string) => rows.map((d) => Number((d as Record<string, unknown>)[k]))
console.log(`\ndoes the board predict next-day return, after removing the weekday effect? (spearman; ${four.length} 4x4 days)`)
console.table(
    (["boardWords", "len6plus", "len3Share", "beatAva", "medianWords"] as const).map((k) => ({
        metric: k,
        "all players": round(spearman(num(four, k), num(four, "returnResid")), 2),
        "regulars": round(spearman(num(four, k), num(four, "regularResid")), 2),
        "regulars, word era only": round(spearman(num(four.filter((d) => d.dice === "word"), k), num(four.filter((d) => d.dice === "word"), "regularResid")), 2),
    }))
)
console.log(`(word era 4x4 days: ${four.filter((d) => d.dice === "word").length})`)
writeCsv(dataPath("retention_days.csv"), residual)
