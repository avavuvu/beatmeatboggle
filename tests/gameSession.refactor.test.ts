import { afterEach, beforeEach, expect, test, vi } from "vitest"
import GameSession from "$lib/GameSession.svelte"
import { getBoardSettings, getPracticeBoardSettings } from "$lib/boardSettings"
import scoreTracker, { ScoreTracker } from "$lib/ScoreTracker.svelte"
import preferences from "$lib/Preferences.svelte"
import { toISODateKey } from "$lib/constants"

beforeEach(() => {
    scoreTracker.pointsMap.clear()
    scoreTracker.avasWords = null
    scoreTracker.avasScore = 0
    preferences.settings.fairFight.value = false
})

afterEach(() => {
    vi.unstubAllGlobals()
})

const stubLocalStorage = () => {
    const store = new Map<string, string>()
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
    })
}

test("board generation is deterministic for a given date", () => {
    const date = new Date("2026-02-01")
    const board1 = getBoardSettings(date)
    const board2 = getBoardSettings(date)

    expect(board1.letters).toStrictEqual(board2.letters)
    expect(board1.size).toBe(board2.size)
    expect(board1.time).toBe(board2.time)
})

test("GameSession uses the board it's given, unmodified", () => {
    const date = new Date("2026-02-01")
    const board = getBoardSettings(date)
    const session = new GameSession(
        board,
        "player",
        null,
        null,
        toISODateKey(date)
    )

    expect(session.board).toStrictEqual(board)
})

test("dateKey passed to constructor is used as-is", () => {
    const date = new Date("2026-02-01")
    const board = getBoardSettings(date)
    const session = new GameSession(
        board,
        "player",
        null,
        null,
        toISODateKey(date)
    )

    expect(session.dateKey).toBe(toISODateKey(date))
})

test("scoreTracker is initialised for player/ava sessions", () => {
    const date = new Date("2026-02-01")
    const board = getBoardSettings(date)
    new GameSession(board, "player", ["cat", "dog"], null, toISODateKey(date))

    expect(scoreTracker.avasWords).toStrictEqual(["cat", "dog"])
})

test("scoreTracker is reset for practice sessions, even if a previous game left avasWords set", () => {
    const board = getPracticeBoardSettings({
        size: 4,
        time: 3,
        dice: "clusters",
        seed: "seed-a",
    })
    scoreTracker.avasWords = ["leftover from a real game"]

    new GameSession(board, "practice", null, null)

    expect(scoreTracker.avasWords).toBeNull()
})

test("practice mode gets no unique/ava bonus at all, since there's no comparison", () => {
    const board = getPracticeBoardSettings({
        size: 4,
        time: 3,
        dice: "clusters",
        seed: "seed-reason",
    })
    preferences.settings.fairFight.value = false

    new GameSession(board, "practice", null, null)
    scoreTracker.addWord("cat")

    expect(scoreTracker.pointsMap.get("cat")).not.toContainEqual(
        expect.objectContaining({ reason: "unique" })
    )
    expect(scoreTracker.pointsMap.get("cat")).not.toContainEqual(
        expect.objectContaining({ reason: "ava bonus" })
    )
    expect(scoreTracker.pointsMap.get("cat")).toStrictEqual([
        { points: ScoreTracker.wordLengthToPoints("cat"), reason: "length" },
    ])
})

test("getReveal's final playerScore excludes the unique bonus in practice mode", () => {
    const board = getPracticeBoardSettings({
        size: 4,
        time: 3,
        dice: "clusters",
        seed: "seed-reveal",
    })
    preferences.settings.fairFight.value = false

    const session = new GameSession(board, "practice", null, null)
    session.foundWords = ["cat"]

    const reveal = scoreTracker.getReveal(
        session.foundWords,
        session.totalPossibleWords
    )

    expect(reveal.hasComparison).toBe(false)
    expect(reveal.didWin).toBeNull()
    expect(reveal.playerScore).toBe(ScoreTracker.wordLengthToPoints("cat"))
    expect(reveal.playerWordMap).toStrictEqual([["cat", false]])
})

test("getReveal still computes a real comparison for player mode", () => {
    const date = new Date("2026-02-01")
    const board = getBoardSettings(date)

    const session = new GameSession(
        board,
        "player",
        ["dog"],
        null,
        toISODateKey(date)
    )
    session.foundWords = ["cat"]

    const reveal = scoreTracker.getReveal(
        session.foundWords,
        session.totalPossibleWords
    )

    expect(reveal.hasComparison).toBe(true)
    expect(reveal.didWin).not.toBeNull()
})

test("player mode still shows 'ava bonus' with fair fight off (unaffected by practice changes)", () => {
    const date = new Date("2026-02-01")
    const board = getBoardSettings(date)
    preferences.settings.fairFight.value = false

    new GameSession(board, "player", [], null, toISODateKey(date))
    scoreTracker.addWord("cat")

    expect(scoreTracker.pointsMap.get("cat")).toContainEqual(
        expect.objectContaining({ reason: "ava bonus" })
    )
})

test("endGame posts to /api/player-words for a player session", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
        json: async () => ({ success: true, average: 10 }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const date = new Date("2026-02-01")
    const board = getBoardSettings(date)
    const session = new GameSession(
        board,
        "player",
        null,
        null,
        toISODateKey(date)
    )
    session.foundWords = ["cat"]

    await session.endGame()

    expect(fetchMock).toHaveBeenCalledWith(
        "/api/player-words",
        expect.objectContaining({ method: "POST" })
    )
})

test("endGame posts to /api/avas-words for an ava session", async () => {
    stubLocalStorage()
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({}) })
    vi.stubGlobal("fetch", fetchMock)

    const date = new Date("2026-02-01")
    const board = getBoardSettings(date)
    const session = new GameSession(
        board,
        "ava",
        null,
        null,
        toISODateKey(date)
    )
    session.foundWords = ["cat"]

    await session.endGame()

    expect(fetchMock).toHaveBeenCalledWith(
        "/api/avas-words",
        expect.objectContaining({ method: "POST" })
    )
})

test("endGame does NOT call fetch for a practice session", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const board = getPracticeBoardSettings({
        size: 4,
        time: 3,
        dice: "clusters",
        seed: "seed-b",
    })
    const session = new GameSession(board, "practice", null, null)
    session.foundWords = ["cat"]

    await session.endGame()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(session.gameState).toBe("gameOver")
})

test("practice session with custom override uses exact letters", () => {
    const board = getPracticeBoardSettings({
        size: 4,
        time: 5,
        dice: "custom",
        override: "abcdefghijklmnop",
    })

    expect(board.letters).toStrictEqual("abcdefghijklmnop".split(""))
    expect(board.size).toBe(4)
    expect(board.time).toBe(5 * 60)
})

test("practice session with same seed is deterministic", () => {
    const boardA = getPracticeBoardSettings({
        size: 4,
        time: 3,
        dice: "clusters",
        seed: "fixed-seed",
    })
    const boardB = getPracticeBoardSettings({
        size: 4,
        time: 3,
        dice: "clusters",
        seed: "fixed-seed",
    })

    expect(boardA.letters).toStrictEqual(boardB.letters)
})

// Note: `browser` from $app/environment is always false in this Node test
// environment, so save()/load() are no-ops regardless of playerState here
// (this was already true before this refactor, just never exercised). These
// tests verify the wiring (dateKey assignment) that *enables* persistence,
// not the actual localStorage read/write, which would need a browser-like
// environment to test meaningfully.

test("practice session's dateKey is set from the key passed to the constructor", () => {
    const board = getPracticeBoardSettings({
        size: 4,
        time: 3,
        dice: "clusters",
        seed: "seed-c",
    })
    const session = new GameSession(board, "practice", null, null, "seed-c")

    expect(session.dateKey).toBe("seed-c")
})

test("practice session with no key has an empty dateKey", () => {
    const board = getPracticeBoardSettings({
        size: 4,
        time: 3,
        dice: "clusters",
        seed: "seed-d",
    })
    const session = new GameSession(board, "practice", null, null)

    expect(session.dateKey).toBe("")
})
