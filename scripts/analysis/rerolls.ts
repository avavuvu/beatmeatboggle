import { writeFileSync } from "node:fs"
import { dataPath, evaluate, loadWords, mean, pct, type Metrics } from "../lib"
import { diceFor, inferSeedWord, loadPlayData, originalBoard, productionSeedWord, weekdayFor, WORD_GENERATOR_SINCE } from "./playData"

const refArg = process.argv.indexOf("--ref")
await loadWords({ ref: refArg >= 0 ? process.argv[refArg + 1] : "66127db" })
const { boards } = loadPlayData()

const rows = boards.filter((b) => b.date_key >= WORD_GENERATOR_SINCE).map((b) => {
    const dice = diceFor(b.date_key)
    const accepted = b.letters.join("")
    const original = originalBoard(b.date_key, b.size)!
    const rerolled = original !== accepted
    const originalSeed = dice === "word" ? productionSeedWord(b.date_key) : null
    const acceptedSeed = dice === "word" ? (rerolled ? inferSeedWord(b.total_words) : originalSeed) : null
    return {
        date: b.date_key,
        weekday: weekdayFor(b.date_key),
        dice,
        size: b.size,
        accepted,
        original,
        rerolled,
        originalSeed,
        acceptedSeed,
        original_m: evaluate(original.split(""), b.size, originalSeed),
        accepted_m: evaluate(b.letters, b.size, acceptedSeed),
    }
})

console.table(
    rows.map((r) => ({
        date: r.date,
        day: r.weekday.slice(0, 3),
        dice: r.dice,
        rerolled: r.rerolled ? "YES" : "",
        "original seed": r.originalSeed ?? "-",
        "orig words": r.original_m.words,
        "orig 6+": r.original_m.len6plus,
        "accepted seed": r.acceptedSeed ?? "-",
        "acc words": r.accepted_m.words,
        "acc 6+": r.accepted_m.len6plus,
    }))
)

const word = rows.filter((r) => r.dice === "word")
const sinceButton = word.filter((r) => r.date >= "2026-09-29")
console.log(`\nword days: ${word.length}, rerolled: ${word.filter((r) => r.rerolled).length}`)
console.log(`since the reroll button (2026-09-29): ${sinceButton.filter((r) => r.rerolled).length} of ${sinceButton.length} word days rerolled`)
console.log(`classic (mon) days rerolled: ${rows.filter((r) => r.dice === "classic" && r.rerolled).length} of ${rows.filter((r) => r.dice === "classic").length}`)

const summarise = (label: string, ms: Metrics[]) => ({
    label,
    n: ms.length,
    words: mean(ms.map((m) => m.words)).toFixed(0),
    "6+": mean(ms.map((m) => m.len6plus)).toFixed(1),
    "7+": mean(ms.map((m) => m.len7plus)).toFixed(1),
    vowels: mean(ms.map((m) => m.vowels)).toFixed(1),
    distinct: mean(ms.map((m) => m.distinct)).toFixed(1),
    hub: pct(mean(ms.map((m) => m.hubShare))),
    weak: mean(ms.map((m) => m.weakTiles)).toFixed(2),
    eeoo: mean(ms.map((m) => m.adjEE + m.adjOO)).toFixed(2),
    "3L%": pct(mean(ms.map((m) => m.len3 / m.words))),
    "pl%": pct(mean(ms.map((m) => m.plurals / m.words))),
})

console.log("\nrevealed preference: boards ava rejected vs accepted (word days)")
console.table(
    [4, 5].flatMap((size) => {
        const s = word.filter((r) => r.size === size)
        return [
            summarise(`${size}x${size} rejected originals`, s.filter((r) => r.rerolled).map((r) => r.original_m)),
            summarise(`${size}x${size} accepted rerolls`, s.filter((r) => r.rerolled).map((r) => r.accepted_m)),
            summarise(`${size}x${size} accepted as generated`, s.filter((r) => !r.rerolled).map((r) => r.accepted_m)),
        ]
    })
)

const strip = ({ wordList, seedPath, ...m }: Metrics) => m
writeFileSync(
    dataPath("rerolls.json"),
    JSON.stringify(
        rows.map(({ original_m, accepted_m, ...r }) => ({ ...r, original: strip(original_m), accepted: strip(accepted_m) })),
        null,
        2
    )
)
