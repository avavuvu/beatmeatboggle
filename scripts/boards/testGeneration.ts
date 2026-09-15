import { generateClassic, generateClusters, generateWithWord } from "../../src/lib/server/generateBoard"
import { solve } from "../../src/lib/dictionary/solver"
import { loadDictionaryFromDisk } from "../../src/lib/server/dictionary"

const trials = Number(process.argv[2] ?? 1000)
const gridSize = Number(process.argv[3] ?? 4)

await loadDictionaryFromDisk()

const sample = (board: string[]) => {
    const found = [...solve(board, gridSize)]
    const usedLetters = new Set(found.join(""))

    return {
        uniqueWords: found.length,
        totalLength: found.reduce((sum, word) => sum + word.length, 0),
        rareLetters: board.filter((letter) => "qzx".includes(letter)).length,
        deadLetters: board.filter((letter) => !usedLetters.has(letter)).length,
    }
}

const summarize = (label: string, generate: (seed: string, gridSize: number) => string[]) => {
    const samples = Array.from({ length: trials }, (_, i) => sample(generate(`${label}-${i}`, gridSize)))

    const total = (key: keyof ReturnType<typeof sample>) =>
        samples.reduce((sum, s) => sum + s[key], 0)

    return {
        board: label,
        "avg unique words": total("uniqueWords") / trials,
        "avg word length": total("totalLength") / Math.max(total("uniqueWords"), 1),
        "avg rare letters": total("rareLetters") / trials,
        "avg dead letters": total("deadLetters") / trials,
    }
}

console.table([
    summarize("classic", generateClassic),
    summarize("clusters", generateClusters),
    summarize("withWord", generateWithWord),
])
