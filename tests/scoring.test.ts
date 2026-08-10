import { beforeEach, describe, expect, test } from "vitest"
import scoreTracker from "$lib/ScoreTracker.svelte"
import preferences from "$lib/Preferences.svelte"
import toaster from "$lib/Toaster.svelte"
import Chain from "$lib/chain.svelte"
import { createGameSession } from "$lib/gameSession"
import GameManager from "$lib/GameManager.svelte"

beforeEach(() => {
    scoreTracker.pointsMap.clear()
    scoreTracker.opponentWords = null
    scoreTracker.opponentScore = 0

    preferences.settings.fairFight.value = false

    toaster.toasts = []
    toaster.showToast = false
})

const createDummyGame = (avasWords: string[] = []) => {
    const session = createGameSession(new Date("2026-01-01"), "player", avasWords)
    const game = new GameManager(session, avasWords)

    game.startGame()

    const chain = new Chain()
    chain.add(0, "o")
    chain.add(1, "n")
    chain.add(2, "e")

    game.currentChain = chain
    game.submitWord()

    return game
}

test("word found by ava gets no uniqueness bonus", () => {
    const game = createDummyGame(["one"])
    const points = scoreTracker.pointsMap.get("one")
    expect(points).not.toContainEqual(
        expect.objectContaining({ reason: "ava bonus" })
    )
    expect(points).not.toContainEqual(
        expect.objectContaining({ reason: "unique" })
    )
})

test("duplicate word is not added twice", () => {
    const game = createDummyGame()

    game.submitWord()
    expect(game.foundWords).toHaveLength(1)
})

test("fair fight setting flows through to scoring", () => {
    preferences.settings.fairFight.value = true
    const game = createDummyGame([])

    expect(scoreTracker.pointsMap.get("one")).toContainEqual(
        expect.objectContaining({ reason: "unique" })
    )
})

test("submitting a word fires a toast", () => {
    createDummyGame()
    expect(toaster.toasts).toHaveLength(1)
    expect(toaster.toasts[0].type).toBe("word")
})
