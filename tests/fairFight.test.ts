import Chain from "$lib/chain.svelte"
import GameSession from "$lib/GameSession.svelte"
import { ScoreTracker } from "$lib/ScoreTracker.svelte"

import { expect, test } from "vitest"

const createDummySession = () => {
    const session = new GameSession(new Date("2026-01-01"), "player", {
        words: ["one", "two", "three"],
        totalWords: null,
        message: null,
        imageData: null,
    })

    session.startGame()

    const chain = new Chain()
    chain.add(0, "o")
    chain.add(1, "n")
    chain.add(2, "e")

    session.currentChain = chain

    session.submitWord()

    return session
}

test("words can be submitted", () => {
    const session = createDummySession()

    expect(session.foundWords).toStrictEqual(["one"])
})

test("'fair fight' off labels unique words as ava bonus", () => {
    const { pointsArray } = ScoreTracker.calculatePoints("cat", [], true, false)

    expect(pointsArray).toContainEqual(
        expect.objectContaining({ reason: "ava bonus" })
    )
})

test("'fair fight' on labels unique words as unique", () => {
    const { pointsArray } = ScoreTracker.calculatePoints("cat", [], true, true)

    expect(pointsArray).toContainEqual(
        expect.objectContaining({ reason: "unique" })
    )
})

test("'fair fight' on checks if ava has a word", () => {
    const { pointsArray } = ScoreTracker.calculatePoints(
        "cat",
        ["cat"],
        true,
        true
    )

    expect(pointsArray).not.toContainEqual(
        expect.objectContaining({ reason: "unique" })
    )
    expect(pointsArray).not.toContainEqual(
        expect.objectContaining({ reason: "ava bonus" })
    )
})

test("'fair fight' off checks if ava has a word", () => {
    const { pointsArray } = ScoreTracker.calculatePoints(
        "cat",
        ["cat"],
        true,
        false
    )

    expect(pointsArray).not.toContainEqual(
        expect.objectContaining({ reason: "unique" })
    )
    expect(pointsArray).not.toContainEqual(
        expect.objectContaining({ reason: "ava bonus" })
    )
})
