import data from "./data.json"
import { weekDayMap, WEEKDAYS } from "../../src/lib/boardSettings"
import { solve } from "../../src/lib/dictionary/solver"
import { dateOverrides } from "../../src/lib/constants"
import { writeFile } from "node:fs/promises"

type Report = {
    date: string
    weekday: string
    gridSize: number
    letters: string[]
    missRate: number
    missedWords: string[]
    avasWords: string[]
    wasRerolled: boolean
}

const reports: Report[] = []

for (const entry of data) {
    const weekday = WEEKDAYS[new Date(entry.dateKey).getUTCDay()]
    const board = weekDayMap[weekday]

    const override = dateOverrides[entry.dateKey]
    const gridSize = override?.size ?? board.size
    const letters = override?.letters ?? board.generateBoard(entry.dateKey, board.size)

    const solution = solve(letters, gridSize)
    const missedWords = entry.words.filter((word) => !solution.has(word))

    const rerolledLetters = board.generateBoard(`${entry.dateKey}-reroll`, board.size)
    const rerolledSolution = solve(rerolledLetters, board.size)
    const rerolledMissedWords = entry.words.filter((word) => !rerolledSolution.has(word))

    const wasRerolled = rerolledMissedWords.length < missedWords.length

    reports.push({
        date: entry.dateKey,
        weekday,
        gridSize: wasRerolled ? board.size : gridSize,
        letters: wasRerolled ? rerolledLetters : letters,
        missRate:
            (wasRerolled ? rerolledMissedWords.length : missedWords.length) / entry.words.length,
        missedWords: wasRerolled ? rerolledMissedWords : missedWords,
        avasWords: entry.words,
        wasRerolled,
    })
}

const formatBoard = (letters: string[], gridSize: number): string => {
    const rows: string[] = []

    for (let row = 0; row < gridSize; row++) {
        const cells = letters
            .slice(row * gridSize, row * gridSize + gridSize)
            .map((letter) => `[${letter.toUpperCase()}]`)

        rows.push(cells.join(" "))
    }

    return rows.join("\n")
}

const totalEntries = reports.length
const entriesWithMisses = reports.filter((report) => report.missedWords.length > 0).length
const entriesOverThreshold = reports.filter((report) => report.missRate > 0.3).length
const entriesRerolled = reports.filter((report) => report.wasRerolled).length

const lines: string[] = []

lines.push("Board Generation Regression Report")
lines.push(`Generated: ${new Date().toISOString()}`)
lines.push(`Entries tested: ${totalEntries}`)
lines.push(`Entries with misses: ${entriesWithMisses}`)
lines.push(`Entries fully matching: ${totalEntries - entriesWithMisses}`)
lines.push(
    `Entries with a higher than 30% miss rate: ${entriesOverThreshold} / ${totalEntries}`
)
lines.push(`Entries rerolled: ${entriesRerolled} / ${totalEntries}`)
lines.push("=".repeat(64))
lines.push("")

for (const report of reports) {
    lines.push("-".repeat(64))
    lines.push(`Date:      ${report.date} (${report.weekday})`)
    lines.push(`Grid size: ${report.gridSize}x${report.gridSize}`)
    lines.push(
        `Miss rate: ${(report.missRate * 100).toFixed(2)}% (${report.missedWords.length} / ${report.avasWords.length})`
    )
    lines.push(`Rerolled:  ${report.wasRerolled ? "yes" : "no"}`)
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
