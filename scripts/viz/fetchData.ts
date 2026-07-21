/// <reference types="bun"/>

import { db } from "../../db"
import { playerWords, avasWords } from "../../db/schema"
import { eq, avg, gte, and } from "drizzle-orm"
import { stringify } from "csv/sync"
import { writeFile } from "node:fs/promises"

const allPlayerData = await db.select().from(playerWords)
const allAvaData = await db.select().from(avasWords)

const csvString = stringify(allAvaData)

const date = new Date().toISOString().split("T")[0]
await writeFile(`./scripts/viz/data/avas_${date}.csv`, csvString)
