import { generateWithWord } from "../../src/lib/server/generateBoard"
import { loadDictionaryFromDisk } from "../../src/lib/server/dictionary"

await loadDictionaryFromDisk()

const dates = process.argv.slice(2)

if (dates.length === 0) {
    console.log("usage: bun run scripts/boards/printWithWord.ts 2026-09-01 2026-09-02 ...")
    process.exit(1)
}

for (const date of dates) {
    console.log(date, generateWithWord(date, 4).join(""))
}
