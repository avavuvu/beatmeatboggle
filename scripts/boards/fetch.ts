import { db } from "../../db"
import { avasWords, boards } from "../../db/schema"
import { eq } from "drizzle-orm"
import { writeFile } from "fs/promises"

const dates = (await db
    .select({ dateKey: avasWords.dateKey, totalWords: boards.totalWords, words: avasWords.words })
    .from(avasWords)
    .leftJoin(boards, eq(boards.dateKey, avasWords.dateKey)))

await writeFile("./scripts/boards/data.json", JSON.stringify(dates),)

console.log( dates )
