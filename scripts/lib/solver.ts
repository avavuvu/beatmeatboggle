import { getAdjacentPositions } from "../../src/lib/constants"
import dictionaryManager from "../../src/lib/dictionary/DictionaryManager"
import type { TrieNode } from "../../src/lib/dictionary/trie"

export const isVowel = (letter: string) => letter !== "" && "aeiou".includes(letter)

const Q = "q".charCodeAt(0) - 97
const U = "u".charCodeAt(0) - 97

export const solveWithTiles = (letters: string[], size: number): Map<string, Set<number>> => {
    const found = new Map<string, Set<number>>()
    const visited = new Array<boolean>(letters.length).fill(false)
    const path: number[] = []

    const dfs = (pos: number, node: TrieNode) => {
        const char = letters[pos]
        const next = char === "q" ? (node.children[Q]?.children[U] ?? null) : node.children[char.charCodeAt(0) - 97]
        if (!next) return

        visited[pos] = true
        path.push(pos)

        if (next.isEnd) {
            let tiles = found.get(next.word!)
            if (!tiles) {
                tiles = new Set()
                found.set(next.word!, tiles)
            }
            for (const p of path) tiles.add(p)
        }

        for (const n of getAdjacentPositions(pos, size)) {
            if (!visited[n]) dfs(n, next)
        }

        path.pop()
        visited[pos] = false
    }

    for (let i = 0; i < letters.length; i++) dfs(i, dictionaryManager.words.root)
    return found
}

export const solveWords = (letters: string[], size: number): string[] => [...solveWithTiles(letters, size).keys()]

export const usedLetters = (letters: string[], size: number): Set<string> => new Set(solveWords(letters, size).join(""))

export const findPath = (letters: string[], size: number, word: string): number[] | null => {
    const w = word.replace("qu", "q")
    const path: number[] = []
    const dfs = (i: number): boolean => {
        if (i === w.length) return true
        const cands = i === 0 ? [...Array(letters.length).keys()] : getAdjacentPositions(path[i - 1], size)
        for (const p of cands) {
            if (path.includes(p) || letters[p] !== w[i]) continue
            path.push(p)
            if (dfs(i + 1)) return true
            path.pop()
        }
        return false
    }
    return dfs(0) ? path : null
}
