import { db } from "../../db"
import { avasWords } from "../../db/schema"
import { writeFile } from "fs/promises"

const dates = (await db
    .select({ dateKey: avasWords.dateKey, totalWords: avasWords.totalWords, words: avasWords.words })
    .from(avasWords))

await writeFile("./scripts/boards/data.json", JSON.stringify(dates),)

console.log( dates )
