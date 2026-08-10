import Chain from "$lib/chain.svelte"
import { createGameSession } from "$lib/gameSession"
import GameManager from "$lib/GameManager.svelte"
import { ScoreTracker } from "$lib/ScoreTracker.svelte"

import { expect, test } from "vitest"

const createDummyGame = () => {
    const session = createGameSession(new Date("2026-01-01"), "player", [
        "one",
        "two",
        "three",
    ])
    const game = new GameManager(session, ["one", "two", "three"])

    game.startGame()

    const chain = new Chain()
    chain.add(0, "o")
    chain.add(1, "n")
    chain.add(2, "e")

    game.currentChain = chain

    game.submitWord()

    return game
}

test("words can be submitted", () => {
    const game = createDummyGame()

    expect(game.foundWords).toStrictEqual(["one"])
})

test("'fair fight' off labels unique words as opponent bonus", () => {
    const { pointsArray } = ScoreTracker.calculatePoints("cat", [], true, false)

    expect(pointsArray).toContainEqual(
        expect.objectContaining({ reason: "opponent bonus" })
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
        expect.objectContaining({ reason: "opponent bonus" })
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
        expect.objectContaining({ reason: "opponent bonus" })
    )
})
