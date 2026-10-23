import { writeFileSync } from "node:fs"

import {
    CURRENT,
    FIXED,
    generateClassicLegacy,
    generateWithWordLegacy,
    REQUIREMENTS,
    SEEDED,
    SELECTIONS,
    WORDLESS_REQUIREMENTS,
    constructLegacy,
    constructSpread,
    curatedPool,
    dataPath,
    evaluate,
    flatMetrics,
    generate,
    isGoodLadder,
    ladderInfo,
    ladderPool,
    loadWords,
    placeablePool,
    productionPool,
    rngFrom,
    singleWordPool,
    writeCsv,
    zipfOf,
    type BoardSize,
    type Construction,
    type Pool,
    type Selection,
} from "../lib"

await loadWords()

const N = Number(process.argv[2] ?? 400)

for (const date of ["2026-09-11", "2026-10-07", "2026-10-22"]) {
    const ours = generate("current", "single", date, 4, productionPool()).letters.join("")
    if (ours !== generateWithWordLegacy(date, 4).join("")) throw new Error(`current/single diverges from generateWithWord for ${date}`)
    if (generate("classic", "single", date, 4).letters.join("") !== generateClassicLegacy(date, 4).join(""))
        throw new Error(`classic/single diverges from generateClassic for ${date}`)
}
console.log("current/single reproduces generateWithWord ✓  classic/single reproduces generateClassic ✓")

type Cell = {
    label: string
    construction: Construction
    selection: Selection
    pool: (size: BoardSize) => Pool | undefined
    sizes: BoardSize[]
}

const cells: Cell[] = []
for (const construction of SEEDED)
    for (const selection of SELECTIONS)
        cells.push({ label: `${construction}/${selection}`, construction, selection, pool: () => placeablePool(), sizes: [4, 5] })
cells.push({ label: "spread/redraw/curated", construction: "spread", selection: "redraw", pool: curatedPool, sizes: [4, 5] })
cells.push({ label: "current/redraw/ladder", construction: "current", selection: "redraw", pool: ladderPool, sizes: [4, 5] })
cells.push({ label: "spread/redraw/ladder", construction: "spread", selection: "redraw", pool: ladderPool, sizes: [4, 5] })
cells.push({ label: "classic/single", construction: "classic", selection: "single", pool: () => undefined, sizes: [4] })
cells.push({ label: "classic/refill", construction: "classic", selection: "refill", pool: () => undefined, sizes: [4] })
cells.push({ label: "bag/single", construction: "bag", selection: "single", pool: () => undefined, sizes: [4, 5] })
cells.push({ label: "bag/refill", construction: "bag", selection: "refill", pool: () => undefined, sizes: [4, 5] })

const rows = []
const timing: Record<string, number> = {}

for (const size of [4, 5] as const) {
    for (const cell of cells) {
        if (!cell.sizes.includes(size)) continue
        const pool = cell.pool(size)
        const t0 = performance.now()
        for (let trial = 0; trial < N; trial++) {
            const r = generate(cell.construction, cell.selection, `trial-${size}-${trial}`, size, pool)
            const info = r.seedWord ? ladderInfo(r.seedWord) : null
            const { seedWord, size: _size, ...m } = flatMetrics(r.metrics)
            rows.push({
                cell: cell.label,
                construction: cell.construction,
                selection: cell.selection,
                pool: pool?.name ?? "-",
                size,
                trial,
                seedWord: r.seedWord,
                seedZipf: r.seedWord ? zipfOf(r.seedWord) : null,
                ladderDepth: info?.depth ?? null,
                ladderMinZipf: info?.minRungZipf ?? null,
                goodLadder: info ? isGoodLadder(info) : null,
                ladder: info ? info.rungs.join(">") : null,
                attempts: r.attempts,
                passed: r.passed,
                ...m,
            })
        }
        const ms = (performance.now() - t0) / N
        timing[`${cell.label} ${size}x${size}`] = ms
        console.log(`${cell.label.padEnd(24)} ${size}x${size}  ${ms.toFixed(1)} ms/board`)
    }
}

writeCsv(dataPath("factorial.csv"), rows)

const EXAMPLE_SEEDS = ["heterodox", "bivouacked", "garrulous", "aerodrome", "exceptional", "hesitated", "nauseates", "interpolate"]
const examples: Record<string, Record<string, unknown>> = {}

for (const seedWord of EXAMPLE_SEEDS) {
    const size: BoardSize = seedWord.length >= 11 ? 5 : 4
    const rng = () => rngFrom(`ex-${seedWord}`)
    const variants: [string, () => { letters: string[] | null; attempts: number }][] = [
        ["current", () => ({ letters: constructLegacy(rng(), size, seedWord, CURRENT), attempts: 1 })],
        ["fixed", () => ({ letters: constructLegacy(rng(), size, seedWord, FIXED), attempts: 1 })],
        ["spread", () => ({ letters: constructSpread(rng(), size, seedWord), attempts: 1 })],
        ["current/refill", () => generate("current", "refill", `ex-${seedWord}`, size, singleWordPool(seedWord))],
        ["spread/refill", () => generate("spread", "refill", `ex-${seedWord}`, size, singleWordPool(seedWord))],
    ]
    examples[seedWord] = {}
    for (const [label, make] of variants) {
        const { letters, attempts } = make()
        if (!letters) continue
        const m = evaluate(letters, size, seedWord)
        examples[seedWord][label] = { letters: m.letters, path: m.seedPath, m: flatMetrics(m), attempts }
    }
}

writeFileSync(dataPath("factorial_examples.json"), JSON.stringify(examples, null, 2))
writeFileSync(
    dataPath("factorial_meta.json"),
    JSON.stringify({ N, cells: cells.map((c) => c.label), timing, requirements: REQUIREMENTS, wordlessRequirements: WORDLESS_REQUIREMENTS }, null, 2)
)
console.log(`wrote ${rows.length} rows to scripts/data/factorial.csv`)
