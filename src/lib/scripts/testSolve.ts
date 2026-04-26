import { solve } from "$lib/dictionary/solver"

const testSolve = () => {
    const board = ["q", "s", "i", "t"] //should be able to make quits
    const solution = solve(board, 2)

    console.log([...solution])
}

testSolve()