import { beforeEach, describe, expect, test } from "vitest"
import scoreTracker from "$lib/ScoreTracker.svelte"
import preferences from "$lib/Preferences.svelte"
import toaster from "$lib/Toaster.svelte"
import Chain from "$lib/chain.svelte"
import GameSession from "$lib/GameSession.svelte"
import { getBoardSettings } from "$lib/boardSettings"
import { toISODateKey } from "$lib/constants"

beforeEach(() => {
    scoreTracker.pointsMap.clear()
    scoreTracker.avasWords = null
    scoreTracker.avasScore = 0

    preferences.settings.fairFight.value = false

    toaster.toasts = []
    toaster.showToast = false
})

const createDummySession = (avasWords: string[] = []) => {
    const date = new Date("2026-01-01")
    const board = getBoardSettings(date)
    const session = new GameSession(
        board,
        "player",
        avasWords,
        null,
        toISODateKey(date)
    )

    session.startGame()

    const chain = new Chain()
    chain.add(0, "o")
    chain.add(1, "n")
    chain.add(2, "e")

    session.currentChain = chain
    session.submitWord()

    return session
}

test("word found by ava gets no uniqueness bonus", () => {
    const session = createDummySession(["one"])
    const points = scoreTracker.pointsMap.get("one")
    expect(points).not.toContainEqual(
        expect.objectContaining({ reason: "ava bonus" })
    )
    expect(points).not.toContainEqual(
        expect.objectContaining({ reason: "unique" })
    )
})

test("duplicate word is not added twice", () => {
    const session = createDummySession()

    session.submitWord()
    expect(session.foundWords).toHaveLength(1)
})

test("fair fight setting flows through to scoring", () => {
    preferences.settings.fairFight.value = true
    const session = createDummySession([])

    expect(scoreTracker.pointsMap.get("one")).toContainEqual(
        expect.objectContaining({ reason: "unique" })
    )
})

test("submitting a word fires a toast", () => {
    createDummySession()
    expect(toaster.toasts).toHaveLength(1)
    expect(toaster.toasts[0].type).toBe("word")
})
