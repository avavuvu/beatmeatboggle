import { writeFileSync } from "node:fs"
import { SCRIPTS_DIR } from "../lib/paths"
import {
    formatLadder,
    generate,
    isGoodLadder,
    ladderInfo,
    ladderPool,
    loadWords,
    rareLetters,
    rngFrom,
    shuffle,
    singleWordPool,
    zipfOf,
    type BoardSize,
} from "../lib"

await loadWords()

const PER_CATEGORY = Number(process.argv[2] ?? 400)

export type Category = "common" | "ladder" | "scrabbly" | "rare"

export const CATEGORY_RULES: Record<Category, { test: (w: string) => boolean; note: (w: string) => string }> = {
    ladder: {
        test: (w) => isGoodLadder(ladderInfo(w)),
        note: (w) => formatLadder(ladderInfo(w).rungs),
    },
    scrabbly: {
        test: (w) => rareLetters(w) >= 1 && !isGoodLadder(ladderInfo(w)),
        note: (w) => [...w].filter((c) => "jqxz".includes(c)).join("").toUpperCase(),
    },
    common: {
        test: (w) => zipfOf(w) >= 4.0 && !isGoodLadder(ladderInfo(w)) && rareLetters(w) === 0,
        note: () => "",
    },
    rare: {
        test: (w) => zipfOf(w) < 2.5 && zipfOf(w) >= 1.5 && !isGoodLadder(ladderInfo(w)) && rareLetters(w) === 0,
        note: () => "",
    },
}

const counts: Record<string, number> = {}

for (const size of [4, 5] as const satisfies BoardSize[]) {
    const pool = ladderPool(size).words
    for (const [category, { test, note }] of Object.entries(CATEGORY_RULES)) {
        const all = pool.filter(test)
        const sample = shuffle(rngFrom(`candidates-${size}-${category}`), [...all])
            .slice(0, PER_CATEGORY)
            .sort()
        counts[`${size}x${size} ${category}`] = all.length
        let unfillable = 0
        const lines = sample.map((w) => {
            const r = generate("spread", "refill", `fill-${w}`, size, singleWordPool(w))
            if (!r.passed) unfillable++
            return [w, zipfOf(w).toFixed(1), r.passed ? String(r.attempts) : "✗", note(w)].join("\t")
        })
        counts[`${size}x${size} ${category} ✗`] = unfillable
        writeFileSync(`${SCRIPTS_DIR}/seeds/candidates/${size}-${category}.txt`, lines.join("\n") + "\n")
        console.log(`${size}x${size} ${category.padEnd(9)} ${all.length} eligible, wrote ${sample.length}, ${unfillable} can't reach the floor`)
    }
}
console.log("wrote scripts/seeds/candidates/*.txt")
