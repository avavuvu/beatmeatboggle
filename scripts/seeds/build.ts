import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { ROOT_DIR, SCRIPTS_DIR } from "../lib/paths"
import { SEED_LENGTHS, isGoodLadder, ladderInfo, ladderPool, ladderWeight, loadWords, rareLetters, zipfOf } from "../lib"
import type { BoardSize } from "../lib"

await loadWords()

type Entry = { word: string; weight: number; ladder: string[]; zipf: number; category: string }

const categoryOf = (w: string) => {
    const info = ladderInfo(w)
    if (isGoodLadder(info)) return "ladder"
    if (rareLetters(w) >= 1) return "scrabbly"
    if (zipfOf(w) >= 4) return "common"
    if (zipfOf(w) < 2.5) return "rare"
    return "mid"
}

const entry = (w: string): Entry => {
    const info = ladderInfo(w)
    return { word: w, weight: ladderWeight(w), ladder: info.depth >= 2 ? info.rungs.slice(1) : [], zipf: zipfOf(w), category: categoryOf(w) }
}

const pruned = `${SCRIPTS_DIR}/seeds/list.txt`
let entries: Entry[]
let source: string

if (existsSync(pruned)) {
    const words = readFileSync(pruned, "utf8")
        .split("\n")
        .map((l) => l.split("\t")[0].trim())
        .filter(Boolean)
    entries = [...new Set(words)].map(entry)
    source = "scripts/seeds/list.txt"
} else {
    const words = new Set<string>()
    for (const size of [4, 5] as BoardSize[]) for (const w of ladderPool(size).words) words.add(w)
    entries = [...words].sort().map(entry)
    source = "ladder pool (curated rules)"
}

const pool = {
    version: 1,
    source,
    lengths: SEED_LENGTHS,
    words: entries.map((e) => [e.word, e.weight, e.ladder, Number(e.zipf.toFixed(1)), e.category]),
}

writeFileSync(`${ROOT_DIR}/static/seedPool.json`, JSON.stringify(pool))

const bySize = ([4, 5] as BoardSize[]).map((size) => {
    const [min, max] = SEED_LENGTHS[size]
    const inBand = entries.filter((e) => e.word.length >= min && e.word.length <= max)
    const weight = inBand.reduce((s, e) => s + e.weight, 0)
    const counts: Record<string, number> = {}
    for (const e of inBand) counts[e.category] = (counts[e.category] ?? 0) + 1
    return {
        size: `${size}x${size}`,
        words: inBand.length,
        ...counts,
        "ladder draw %": Math.round((inBand.filter((e) => e.category === "ladder").reduce((s, e) => s + e.weight, 0) / weight) * 100),
    }
})
console.table(bySize)
console.log(`wrote static/seedPool.json from ${source}: ${entries.length} words`)
