import { beforeAll, describe, expect, it } from "vitest"
import { loadDictionaryFromDisk } from "../dictionary"
import { generateBoard, generateClassicLegacy, generateWithWordLegacy, floorFor, FILLS_PER_WORD } from "."
import { passesFloor, quality } from "./floor"
import { DICE } from "../../board"

beforeAll(async () => {
    await loadDictionaryFromDisk()
})

describe("legacy generators reproduce the boards that shipped", () => {
    it("word generator, 2026-10-07", () => {
        expect(generateWithWordLegacy("2026-10-07", 4).join("")).toBe("uaehmrtehodhdoxu")
    })

    it("word generator, 2026-09-13 (5x5)", () => {
        expect(generateWithWordLegacy("2026-09-13", 5).join("")).toBe("olnihaoetatrpsixehtoetnsr")
    })

    it("classic generator, 2026-10-19", () => {
        expect(generateClassicLegacy("2026-10-19", 4).join("")).toBe("nuulntlqemttemhx")
    })
})

describe("generateBoard", () => {
    it("is deterministic from the seed", () => {
        for (const dice of DICE) {
            const a = generateBoard(dice, "determinism", 4)
            const b = generateBoard(dice, "determinism", 4)
            expect(a.letters).toEqual(b.letters)
            expect(a.seedWord).toBe(b.seedWord)
        }
    })

    it("returns a solved word list that matches the letters", () => {
        const board = generateBoard("word", "solved", 4)
        expect(new Set(board.words)).toEqual(new Set(quality(board.letters, 4, board.seedWord).words))
    })

    it("places the seed word so it is findable", () => {
        for (let i = 0; i < 10; i++) {
            const board = generateBoard("word", `seed-${i}`, 4)
            expect(board.seedWord).not.toBeNull()
            expect(board.words).toContain(board.seedWord)
        }
    })

    it("clears the floor on almost every date for every dice", () => {
        const sizes = { word: [4, 5], spread: [4, 5], classic: [4], bag: [4, 5] } as const
        for (const [dice, sizeList] of Object.entries(sizes)) {
            for (const size of sizeList) {
                const results = Array.from({ length: 25 }, (_, i) => generateBoard(dice as (typeof DICE)[number], `floor-${i}`, size))
                const passed = results.filter((r) => r.passed).length
                expect(passed, `${dice} ${size}x${size}`).toBeGreaterThanOrEqual(24)
                for (const r of results) if (r.passed) expect(passesFloor(quality(r.letters, size, r.seedWord), floorFor(dice as (typeof DICE)[number], size))).toBe(true)
            }
        }
    })

    it("tries a new seed word after a few failed fills", () => {
        const board = generateBoard("word", "redraw", 4)
        expect(board.attempts).toBeLessThanOrEqual(40)
        if (board.attempts > FILLS_PER_WORD) expect(board.seedWord).not.toBeNull()
    })

    it("has no hidden word for wordless dice", () => {
        expect(generateBoard("classic", "x", 4).seedWord).toBeNull()
        expect(generateBoard("bag", "x", 4).ladder).toEqual([])
    })
})
