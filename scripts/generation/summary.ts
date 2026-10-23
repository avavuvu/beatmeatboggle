import { bootstrapCI, dataPath, mean, median, pct, quantile, readCsv, round, share } from "../lib"

type Row = Record<string, string | number | boolean | null>
const rows = readCsv<Row>(dataPath("factorial.csv"))
const num = (rs: Row[], k: string) => rs.map((r) => Number(r[k]))

const SEEDED_CELLS = [
    "current/single", "fixed/single", "spread/single",
    "current/refill", "fixed/refill", "spread/refill",
    "current/redraw", "fixed/redraw", "spread/redraw",
    "spread/redraw/curated", "current/redraw/ladder", "spread/redraw/ladder",
]
const WORDLESS_CELLS = ["classic/single", "classic/refill", "bag/single", "bag/refill"]

const summarise = (cell: string, size: number) => {
    const rs = rows.filter((r) => r.cell === cell && r.size === size)
    if (!rs.length) return null
    const seeded = rs.filter((r) => r.seedWord)
    return {
        cell,
        "median words": median(num(rs, "words")),
        "p10 words": quantile(num(rs, "words"), 0.1),
        "6+": round(mean(num(rs, "len6plus"))),
        "7+": round(mean(num(rs, "len7plus"))),
        "3L%": pct(mean(rs.map((r) => Number(r.len3) / Number(r.words)))),
        vowels: round(mean(num(rs, "vowels"))),
        distinct: round(mean(num(rs, "distinct"))),
        eeoo: round(mean(rs.map((r) => Number(r.adjEE) + Number(r.adjOO)))),
        jqxz: round(mean(num(rs, "rare"))),
        "meets reqs": pct(share(rs.map((r) => r.passed === true))),
        "med tries": median(num(rs, "attempts")),
        "seed plural%": seeded.length ? pct(share(seeded.map((r) => r.seedInflection === "plural"))) : "-",
        "seed zipf<3": seeded.length ? pct(share(seeded.map((r) => Number(r.seedZipf) < 3))) : "-",
        "good ladder": seeded.length ? pct(share(seeded.map((r) => r.goodLadder === true))) : "-",
    }
}

for (const size of [4, 5]) {
    const n = rows.filter((r) => r.cell === "current/single" && r.size === size).length
    console.log(`\n### ${size}x${size} — seeded cells (N per cell = ${n})`)
    console.table(SEEDED_CELLS.map((c) => summarise(c, size)).filter(Boolean))
    console.log(`\n### ${size}x${size} — wordless cells`)
    console.table(WORDLESS_CELLS.map((c) => summarise(c, size)).filter(Boolean))
}

for (const size of [4, 5]) {
    const base = new Map(rows.filter((r) => r.cell === "current/single" && r.size === size).map((r) => [r.trial, r]))
    console.log(`\n### ${size}x${size} — paired deltas vs current/single (same trial; same seed word where marked)`)
    console.table(
        [...SEEDED_CELLS.slice(1), ...WORDLESS_CELLS]
            .map((cell) => {
                const rs = rows.filter((r) => r.cell === cell && r.size === size)
                if (!rs.length) return null
                const sameSeed = /\/(single|refill)$/.test(cell) && !/^(classic|bag)/.test(cell)
                const d = rs.map((r) => Number(r.words) - Number(base.get(r.trial)!.words))
                const d6 = rs.map((r) => Number(r.len6plus) - Number(base.get(r.trial)!.len6plus))
                const [lo, hi] = bootstrapCI(d)
                return {
                    cell,
                    "same seed": sameSeed ? "yes" : "no",
                    "Δ words": round(mean(d)),
                    "95% CI": `${round(lo)} … ${round(hi)}`,
                    "Δ 6+": round(mean(d6)),
                    "trials ≥ base": pct(share(d.map((x) => x >= 0))),
                }
            })
            .filter(Boolean)
    )
}

const ladders = rows.filter((r) => r.cell === "spread/redraw/ladder" && r.size === 4 && r.goodLadder)
console.log(`\n### example ladder draws from spread/redraw/ladder (4x4)`)
console.log(ladders.slice(0, 12).map((r) => `${String(r.ladder).replaceAll(">", " → ")}  (${r.words} words, seed zipf ${r.seedZipf})`).join("\n"))
