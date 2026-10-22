import { writeFileSync } from "node:fs"
import {
    curatedPool,
    dataPath,
    formatLadder,
    isGoodLadder,
    ladderInfo,
    ladderPool,
    ladderWeight,
    loadWords,
    pct,
    readCsv,
    spearman,
    substringWords,
    zipfOf,
} from "../lib"

await loadWords()

type Day = { seedWord: string; foundSeed: number; dice: string } & Record<string, string | number | boolean | null>
const days = readCsv<Day>(dataPath("play_days.csv")).filter((d) => d.dice === "word")

console.log("### real seed words: family ladder with zipf, vs how many players found the seed")
console.table(
    days
        .map((d) => {
            const info = ladderInfo(d.seedWord)
            return {
                seed: d.seedWord,
                "found by": pct(Number(d.foundSeed), 1),
                ladder: formatLadder(info.rungs, true),
                depth: info.depth,
                "min rung zipf": info.minRungZipf.toFixed(1),
                good: isGoodLadder(info) ? "✓" : "",
                weight: ladderWeight(d.seedWord),
            }
        })
        .sort((a, b) => parseFloat(b["found by"]) - parseFloat(a["found by"]))
)

writeFileSync(
    dataPath("ladder_days.json"),
    JSON.stringify(
        Object.fromEntries(days.map((d) => [d.seedWord, { ...ladderInfo(d.seedWord), foundSeed: Number(d.foundSeed) }])),
        null,
        2
    )
)

const found = days.map((d) => Number(d.foundSeed))
const rho = (xs: number[]) => spearman(xs, found).toFixed(2)
console.log(
    `spearman vs seed find rate (n=${days.length}): ladder depth ${rho(days.map((d) => ladderInfo(d.seedWord).depth))}, ` +
        `min rung zipf ${rho(days.map((d) => ladderInfo(d.seedWord).minRungZipf))}, ` +
        `seed zipf ${rho(days.map((d) => zipfOf(d.seedWord)))}, ` +
        `sub-words≥5 ${rho(days.map((d) => substringWords(d.seedWord, 5).length))}`
)

for (const size of [4, 5] as const) {
    const pool = ladderPool(size)
    const infos = pool.words.map(ladderInfo)
    const good = infos.filter(isGoodLadder)
    const weights = pool.words.map(ladderWeight)
    const total = weights.reduce((a, b) => a + b, 0)
    const goodWeight = pool.words.reduce((s, _, i) => s + (isGoodLadder(infos[i]) ? weights[i] : 0), 0)
    console.log(`\n### ${size}x${size} ladder pool: ${pool.words.length} words (curated ${curatedPool(size).words.length} minus zipf<1)`)
    console.log(`good ladders: ${good.length} (${pct(good.length / pool.words.length, 1)}), all-prefix ${good.filter((i) => i.allPrefix).length}, rare top word ${good.filter((i) => i.topZipf < 3).length}`)
    console.log(`weighted draw lands on a good ladder: ${pct(goodWeight / total, 1)} (uniform: ${pct(good.length / pool.words.length, 1)})`)
}
