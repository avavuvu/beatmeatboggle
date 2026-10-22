import { dataPath, mean, pct, readCsv, spearman } from "../lib"

type Day = Record<string, string | number | boolean | null>

const days = readCsv<Day>(dataPath("play_days.csv"))
const num = (rows: Day[], k: string) => rows.map((r) => Number(r[k]))

const word4 = days.filter((d) => d.dice === "word" && d.size === 4)
const word5 = days.filter((d) => d.dice === "word" && d.size === 5)

const METRICS = ["words", "len6plus", "len7plus", "len3Share", "pluralShare", "vowels", "distinct", "hubShare", "weakTiles", "eeoo", "rare", "e", "s"]
const OUTCOMES = ["medianWords", "medianScore", "has6", "has7", "beatAva", "meanLongest"]

const table = (rows: Day[], label: string) => {
    console.log(`\n### ${label} (n=${rows.length}) — spearman, board metric vs player outcome`)
    console.table(
        METRICS.map((m) => ({
            metric: m,
            ...Object.fromEntries(OUTCOMES.map((o) => [o, spearman(num(rows, m), num(rows, o)).toFixed(2)])),
        }))
    )
}

table(word4, "4x4 word days")
table(word5, "5x5 word days")

console.log("\n### seed word: how many players found it?")
const seeded = days.filter((d) => d.dice === "word")
console.table(
    seeded
        .map((d) => ({ date: d.date, size: d.size, seed: d.seedWord, form: d.seedInflection, "found by": pct(Number(d.foundSeed), 1), players: d.players }))
        .sort((a, b) => parseFloat(b["found by"]) - parseFloat(a["found by"]))
)
const rates = num(seeded, "foundSeed").sort((a, b) => a - b)
console.log(
    `median seed find rate ${pct(rates[Math.floor(rates.length / 2)], 1)}, days ≥5%: ${rates.filter((r) => r >= 0.05).length}/${rates.length}, days <1%: ${rates.filter((r) => r < 0.01).length}/${rates.length}`
)

console.log("\n### effective board size: words found by ≥1% of players vs total")
console.table(
    [word4, word5].map((rows, i) => ({
        size: i === 0 ? "4x4" : "5x5",
        "mean total words": mean(num(rows, "words")).toFixed(0),
        "found by ≥1%": mean(num(rows, "findableByOnePct")).toFixed(0),
        "found by ≥5%": mean(num(rows, "findableByFivePct")).toFixed(0),
        "6+ total": mean(num(rows, "len6plus")).toFixed(1),
        "6+ found by ≥1%": mean(num(rows, "longFoundByOnePct")).toFixed(1),
        "median player words": mean(num(rows, "medianWords")).toFixed(1),
    }))
)
