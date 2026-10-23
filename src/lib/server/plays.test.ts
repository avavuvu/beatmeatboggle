import { describe, expect, it } from "vitest"
import { PlayError, validatePlay } from "./validatePlay"

const today = "2026-10-22"
const board = ["tea", "eat", "team", "steam"]
const ok = {
    dateKey: today,
    words: ["tea", "team"],
    fairFight: false,
    playerId: "0123456789ab",
    challengedBy: null,
}

describe("validatePlay", () => {
    it("accepts a daily play and drops words not on the board", () => {
        const play = validatePlay(
            { ...ok, words: ["tea", "zzz", "team", "tea", 5] },
            today,
            board
        )
        expect(play.words).toEqual(["tea", "team"])
        expect(play.mode).toBe("daily")
    })

    it("classifies archive and challenge plays", () => {
        expect(
            validatePlay({ ...ok, dateKey: "2026-10-01" }, today, board).mode
        ).toBe("archive")
        expect(
            validatePlay({ ...ok, challengedBy: "ba9876543210" }, today, board)
                .mode
        ).toBe("challenge")
    })

    it("rejects future dates", () => {
        expect(() =>
            validatePlay({ ...ok, dateKey: "2026-10-23" }, today, board)
        ).toThrow(PlayError)
    })

    it("rejects malformed input", () => {
        expect(() =>
            validatePlay({ ...ok, dateKey: "yesterday" }, today, board)
        ).toThrow("Invalid dateKey")
        expect(() =>
            validatePlay({ ...ok, words: "tea" }, today, board)
        ).toThrow("Invalid words")
        expect(() =>
            validatePlay({ ...ok, playerId: "<script>" }, today, board)
        ).toThrow("Invalid playerId")
        expect(() =>
            validatePlay({ ...ok, challengedBy: "x".repeat(40) }, today, board)
        ).toThrow("Invalid challengedBy")
        expect(() =>
            validatePlay(
                { ...ok, words: new Array(2001).fill("tea") },
                today,
                board
            )
        ).toThrow("Invalid words")
    })

    it("ignores any score the client sends", () => {
        const play = validatePlay(
            { ...ok, score: 9999 } as typeof ok,
            today,
            board
        )
        expect("score" in play).toBe(false)
    })
})
