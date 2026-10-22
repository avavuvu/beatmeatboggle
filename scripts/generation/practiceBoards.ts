import { writeFileSync } from "node:fs"
import {
    dataPath,
    formatLadder,
    generate,
    isGoodLadder,
    ladderInfo,
    ladderPool,
    loadWords,
    zipfOf,
    type BoardSize,
    type Construction,
} from "../lib"

await loadWords()

const batch = process.argv[2] ?? "a"
const BASE = "https://beatmeatboggle.com/practice/play"

const goodLadders = (size: BoardSize) => {
    const pool = ladderPool(size)
    return { name: `goodLadders${size}`, words: pool.words.filter((w) => isGoodLadder(ladderInfo(w))) }
}

const plan: [BoardSize, Construction][] = [
    [4, "current"], [4, "spread"], [4, "current"], [4, "spread"], [4, "current"], [4, "spread"],
    [4, "current"], [4, "spread"], [5, "current"], [5, "spread"], [5, "current"], [5, "spread"],
]

const boards = plan.map(([size, construction], i) => {
    const r = generate(construction, "redraw", `practice-${batch}-${i}`, size, goodLadders(size))
    const letters = r.letters.join("")
    return {
        id: i + 1,
        size,
        construction,
        url: `${BASE}?size=${size}&time=${size === 5 ? 4 : 3}&dice=custom&override=${letters}`,
        letters,
        seedWord: r.seedWord!,
        ladder: formatLadder(ladderInfo(r.seedWord!).rungs, true),
        seedZipf: zipfOf(r.seedWord!),
        words: r.metrics.words,
        len6plus: r.metrics.len6plus,
        attempts: r.attempts,
    }
})

console.log(`practice boards, batch "${batch}" — answers in scripts/data/practice_${batch}.json\n`)
for (const b of boards) console.log(`${String(b.id).padStart(2)}. ${b.size}x${b.size}  ${b.url}`)

writeFileSync(dataPath(`practice_${batch}.json`), JSON.stringify(boards, null, 2))
