import data from "./data.json"
import boards from "./boards.json"
import { WEEKDAYS } from "../../src/lib/server/boardSettings"
import { dateFromKey } from "../../src/lib/constants"
import { writeFile } from "node:fs/promises"

type Report = {
    date: string
    weekday: string
    gridSize: number
    letters: string
    missRate: number
    missedWords: string[]
    avasWords: string[]
    source: string
}

const boardsByDate = new Map(boards.map((board) => [board.dateKey, board]))

const reports: Report[] = []

for (const entry of data) {
    const board = boardsByDate.get(entry.dateKey)

    if (!board) {
        console.warn(`${entry.dateKey}: no board in boards.json`)
        continue
    }

    const totalWords = new Set(board.totalWords)
    const missedWords = entry.words.filter((word) => !totalWords.has(word))

    reports.push({
        date: entry.dateKey,
        weekday: WEEKDAYS[dateFromKey(entry.dateKey).getUTCDay()],
        gridSize: board.size,
        letters: board.letters,
        missRate: missedWords.length / entry.words.length,
        missedWords,
        avasWords: entry.words,
        source: board.source,
    })
}

const formatBoard = (letters: string, gridSize: number): string => {
    const rows: string[] = []

    for (let row = 0; row < gridSize; row++) {
        const cells = letters
            .slice(row * gridSize, row * gridSize + gridSize)
            .split("")
            .map((letter) => `[${letter.toUpperCase()}]`)

        rows.push(cells.join(" "))
    }

    return rows.join("\n")
}

const totalEntries = reports.length
const entriesWithMisses = reports.filter((report) => report.missedWords.length > 0).length
const entriesOverThreshold = reports.filter((report) => report.missRate > 0.3).length

const lines: string[] = []

lines.push("Board Reconstruction Report")
lines.push(`Generated: ${new Date().toISOString()}`)
lines.push(`Entries tested: ${totalEntries}`)
lines.push(`Entries with misses: ${entriesWithMisses}`)
lines.push(`Entries fully matching: ${totalEntries - entriesWithMisses}`)
lines.push(
    `Entries with a higher than 30% miss rate: ${entriesOverThreshold} / ${totalEntries}`
)
lines.push("=".repeat(64))
lines.push("")

for (const report of reports) {
    lines.push("-".repeat(64))
    lines.push(`Date:      ${report.date} (${report.weekday})`)
    lines.push(`Grid size: ${report.gridSize}x${report.gridSize}`)
    lines.push(
        `Miss rate: ${(report.missRate * 100).toFixed(2)}% (${report.missedWords.length} / ${report.avasWords.length})`
    )
    lines.push(`Source:    ${report.source}`)
    lines.push("")
    lines.push("Board:")
    lines.push(formatBoard(report.letters, report.gridSize))
    lines.push("")

    // if (report.missedWords.length > 0) {
    //     lines.push(`Missed words (${report.missedWords.length}):`)
    //     for (const word of report.missedWords) {
    //         lines.push(`  - ${word}`)
    //     }
    // } else {
    //     lines.push("Missed words: none")
    // }

    lines.push("")
}

lines.push("=".repeat(64))

await writeFile("./scripts/boards/reports.txt", lines.join("\n"))
