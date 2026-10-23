import { generateBoard } from "../../src/lib/server/generateBoard"
import { dataPath, generateClassicLegacy, generateWithWordLegacy, loadWords, writeCsv } from "../lib"

await loadWords()

const N = Number(process.argv[2] ?? 1000)

const GENERATORS: { label: string; sizes: number[]; make: (seed: string, size: number) => string[] }[] = [
    { label: "word (before)", sizes: [4, 5], make: (s, n) => generateWithWordLegacy(s, n) },
    { label: "word (now)", sizes: [4, 5], make: (s, n) => generateBoard("word", s, n).letters },
    { label: "classic (before)", sizes: [4], make: (s, n) => generateClassicLegacy(s, n) },
    { label: "classic (now)", sizes: [4], make: (s, n) => generateBoard("classic", s, n).letters },
    { label: "spread", sizes: [4, 5], make: (s, n) => generateBoard("spread", s, n).letters },
    { label: "bag", sizes: [4, 5], make: (s, n) => generateBoard("bag", s, n).letters },
]

const rows = []
for (const { label, sizes, make } of GENERATORS) {
    for (const size of sizes) {
        const t0 = performance.now()
        for (let i = 0; i < N; i++) rows.push({ generator: label, size, trial: i, letters: make(`looks-${size}-${i}`, size).join("") })
        console.log(`${label.padEnd(18)} ${size}x${size}  ${((performance.now() - t0) / N).toFixed(1)} ms/board`)
    }
}

writeCsv(dataPath("looks.csv"), rows)
console.log(`wrote ${rows.length} boards to scripts/data/looks.csv`)
