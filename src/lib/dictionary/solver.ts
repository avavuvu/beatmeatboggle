import type { TrieNode } from "./trie"
import dictionaryManager from "./trie"

type Board = {
    grid: string[][]
    visited: boolean[][]
}

export const solve = (boardTiles: string[], gridSize: number) => {
    const results: Set<string> = new Set()

    const board = boardTiles.reduce((board, letter, index) => {
        const col = index % gridSize;
        const row = Math.floor(index / gridSize);

        if (!board.grid[row]) {
            board.grid[row] = [];
            board.visited[row] = [];
        }

        board.grid[row][col] = letter;
        board.visited[row][col] = false;

        return board;
    }, {
        grid: [] as string[][],
        visited: [] as boolean[][]
    })

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            dfs(board, row, col, dictionaryManager.words.root, results, gridSize)
        }
    }

    return results
}

function dfs(board: Board, row: number, col: number, node: TrieNode, results: Set<string>, gridSize: number) {
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
        return
    }

    if (board.visited[row][col]) {
        return
    }

    const char = board.grid[row][col]

    const alphabetIndex = char.charCodeAt(0) - 97
    const nextNode: TrieNode | null = node.children[alphabetIndex]

    if (!nextNode) {
        return
    }

    if (nextNode.isEnd) {
        results.add(nextNode.word!)
    }

    board.visited[row][col] = true

    for (const directionR of [-1, 0, 1]) {
        for (const directionC of [-1, 0, 1]) {
            if (directionR === 0 && directionC === 0) {
                continue
            }

            dfs(board, row + directionR, col + directionC, nextNode, results, gridSize)
        }
    }

    board.visited[row][col] = false
}