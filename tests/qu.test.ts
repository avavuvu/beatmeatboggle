import { expect, test } from "vitest"
import { solve } from "$lib/dictionary/solver"

test("Solves QUIT with QSIT", () => {
    const board = ["q", "s", "i", "t"] //should be able to make quit
    const solution = solve(board, 2)

    expect([...solution]).toStrictEqual(["quit", "quits", "sit", "its", "tis"])
})
