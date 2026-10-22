import { getAdjacentPositions } from "../../../src/lib/constants"
import { shuffle, type Rng } from "../rng"
import { bagFill } from "./bag"

const spreadWalk = (rng: Rng, word: string, size: number): number[] | null => {
    const n = size * size
    let best: number[] | null = null
    let bestSpread = -1

    for (let attempt = 0; attempt < 8; attempt++) {
        const path: number[] = []
        const used = new Array<boolean>(n).fill(false)
        const dfs = (i: number): boolean => {
            if (i === word.length) return true
            const cands =
                i === 0 ? shuffle(rng, [...Array(n).keys()]) : shuffle(rng, getAdjacentPositions(path[i - 1], size))
            for (const p of cands) {
                if (used[p]) continue
                used[p] = true
                path.push(p)
                if (dfs(i + 1)) return true
                path.pop()
                used[p] = false
            }
            return false
        }
        if (!dfs(0)) continue
        const rows = new Set(path.map((p) => Math.floor(p / size))).size
        const cols = new Set(path.map((p) => p % size)).size
        if (rows + cols > bestSpread) {
            bestSpread = rows + cols
            best = [...path]
        }
    }
    return best
}

export const constructSpread = (rng: Rng, size: number, chosen: string): string[] | null => {
    const seedWord = chosen.replace("qu", "q")
    const board = Array.from({ length: size * size }, () => "")

    const path = spreadWalk(rng, seedWord, size)
    if (!path) return null
    path.forEach((p, i) => (board[p] = seedWord[i]))

    return bagFill(rng, board, size, new Set(path))
}
