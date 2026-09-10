import data from "./data.json"
import { generateClassic, generateClusters } from "../../src/lib/server/generateBoard"
import { solve } from "../../src/lib/dictionary/solver"
import { dateFromKey, toISODateKey } from "../../src/lib/constants"
import { loadDictionaryFromDisk } from "../../src/lib/server/dictionary"
import { getGameDateKey } from "../../src/lib/server/gameDate"
import { writeFile } from "node:fs/promises"

// one-off reconstruction of every board that was ever served, including the two hacks
// production no longer has: hand-pasted overrides, and the client-side reroll when a board
// solved to fewer than 130 words. the reroll check used to run against an older, much larger
// dictionary, so re-applying the threshold today gives wrong answers for early dates; where
// ava's recorded words exist they decide instead. run once, commit boards.json, then this file can go.
//
// the weekday mapping below is the one that was live for these dates. it must not follow
// weekDayMap, which has since moved on to generateWithWord.

const historicalGeneration = [
    { size: 5, generateBoard: generateClusters, time: 4 * 60 },
    { size: 4, generateBoard: generateClassic, time: 3 * 60 },
    { size: 4, generateBoard: generateClassic, time: 3 * 60 },
    { size: 4, generateBoard: generateClusters, time: 3 * 60 },
    { size: 4, generateBoard: generateClusters, time: 3 * 60 },
    { size: 4, generateBoard: generateClusters, time: 3 * 60 },
    { size: 5, generateBoard: generateClusters, time: 4 * 60 },
]

const historicalOverrides: Record<string, string> = {
    "2026-04-20": "hapybdayriasingh",
    "2026-08-24": "eefisrtatkshcaco",
    "2026-08-25": "eyaoegebntesihom",
    "2026-08-26": "tronoshoeiptsema",
    "2026-08-27": "cshuehsoeboaodri",
    "2026-08-28": "vdyoeolotedysunt",
    "2026-08-29": "ireaistesueztwhgarinlmooa",
    "2026-08-30": "oneeolaistvngrhoaitoxleeo",
    "2026-08-31": "araonmohreingseo",
    "2026-09-01": "irainenbgedclyuo",
    "2026-09-02": "bleysopnouetsaer",
    "2026-09-03": "edeteustmilsecal",
    "2026-09-04": "ponsareetssirdua",
    "2026-09-05": "ezautvdroielioulfuftunlie",
    "2026-09-06": "vaolntsiolialcarpiwxeemet",
    "2026-09-07": "einefradertvozse",
    "2026-09-08": "centifershsoting",
    "2026-09-09": "tnfucoiaosctisee",
    "2026-09-10": "kdeoelellqarturh",
}

type ExportedBoard = {
    dateKey: string
    size: number
    letters: string
    time: number
    totalWords: string[]
    source: "override" | "generated" | "rerolled" | "unverified"
}

await loadDictionaryFromDisk()

const recordedWords = new Map(data.map((entry) => [entry.dateKey, entry.words]))
const firstDateKey = [...recordedWords.keys()].sort()[0]
const lastDateKey = getGameDateKey()

const missCount = (words: string[], totalWords: string[]) => {
    const found = new Set(totalWords)
    return words.filter((word) => !found.has(word)).length
}

const boards: ExportedBoard[] = []

for (
    let date = dateFromKey(firstDateKey);
    toISODateKey(date) <= lastDateKey;
    date.setUTCDate(date.getUTCDate() + 1)
) {
    const dateKey = toISODateKey(date)
    const generation = historicalGeneration[date.getUTCDay()]
    const override = historicalOverrides[dateKey]

    if (override) {
        const size = Math.sqrt(override.length)
        boards.push({
            dateKey,
            size,
            letters: override,
            time: size === 5 ? 4 * 60 : 3 * 60,
            totalWords: [...solve(override.split(""), size)],
            source: "override",
        })
        continue
    }

    const original = generation.generateBoard(dateKey, generation.size)
    const rerolled = generation.generateBoard(`${dateKey}-reroll`, generation.size)
    const originalWords = [...solve(original, generation.size)]
    const rerolledWords = [...solve(rerolled, generation.size)]

    const recorded = recordedWords.get(dateKey)

    const useReroll = recorded
        ? missCount(recorded, rerolledWords) < missCount(recorded, originalWords)
        : originalWords.length < 130

    const letters = useReroll ? rerolled : original
    const totalWords = useReroll ? rerolledWords : originalWords

    const unverified = recorded !== undefined && missCount(recorded, totalWords) / recorded.length > 0.3

    boards.push({
        dateKey,
        size: generation.size,
        letters: letters.join(""),
        time: generation.time,
        totalWords,
        source: unverified ? "unverified" : useReroll ? "rerolled" : "generated",
    })
}

await writeFile("./scripts/boards/boards.json", JSON.stringify(boards, null, 2))

const counts = boards.reduce<Record<string, number>>((acc, board) => {
    acc[board.source] = (acc[board.source] ?? 0) + 1
    return acc
}, {})

console.log(`wrote ${boards.length} boards (${firstDateKey} to ${lastDateKey})`, counts)
