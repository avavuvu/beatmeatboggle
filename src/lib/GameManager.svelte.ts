import { solve } from "./dictionary/solver"
import dictionaryManager from "./dictionary/trie"
import { generateClassic, generateClaude, generateClusters } from "./generateBoard"
import { GRID_SIZE, getAdjacentPositions } from "./constants"
import toastManager from "./ToastManager.svelte"
import scoreManager from "./ScoreManager.svelte"
export { getAdjacentPositions } from "./constants"

class Chain {
    #letters = $state<Array<[number, string]>>([])

    get length() {
        return this.#letters.length
    }

    getString = () => {
        return this.#letters
            .map(([_, letter]) => letter)
            .join('')
    }

    add = (key: number, letter: string): boolean => {
        if (this.containsKey(key)) {
            return false
        }

        this.#letters.push([key, letter])

        return true
    }

    containsKey = (key: number) => {
        for (const [k] of this.#letters) {
            if (key === k) {
                return true
            }
        }
        return false
    }

    clear = () => {
        this.#letters = []
    }

    get = (searchKey: number) => {
        const find = this.#letters.find(([key]) => searchKey === key)
        if (!find) {
            return undefined
        }
        return find[1]
    }

    remove = (searchKey: number) => {
        this.#letters = this.#letters
            .filter(([key]) => key !== searchKey)
    }

    removeLast = () => {
        return this.#letters.pop()
    }

    last = () => {
        if (this.#letters.length === 0) {
            return undefined
        }

        return this.#letters[this.#letters.length - 1]
    }

        ; *[Symbol.iterator]() {
            yield* this.#letters
        }
}


class GameManager {
    letters: string[] = $state([])
    foundWords: string[] = $state([])
    currentChain = $state(new Chain())
    totalPossibleWords: string[] = $state([])
    secondsLeft: number = $state(5)
    gameOver: boolean = $state(false)

    playerState: "ava" | "player" = $state("player")
    dateKey: string = $state("")

    isTentative: boolean = $state(false)

    #timerHandle: ReturnType<typeof setInterval> | undefined = undefined

    init = (dateKey: string, playerState: "ava" | "player", avasWords: null | string[], histogram: any) => {
        this.dateKey = dateKey
        this.playerState = playerState

        this.letters = generateClusters(this.dateKey)
        this.totalPossibleWords = [...solve(this.letters)]
        this.secondsLeft = 3 * 60
        this.gameOver = false
        this.foundWords = []
        this.currentChain.clear()

        scoreManager.init(
            this.totalPossibleWords,
            avasWords,
            histogram
        )

        clearInterval(this.#timerHandle)
        this.#timerHandle = setInterval(() => {
            this.secondsLeft -= 1
            if (this.secondsLeft <= 0) {
                this.secondsLeft = 0
                this.endGame()
                clearInterval(this.#timerHandle)
            }
        }, 1000)
    }

    endGame = () => {
        this.gameOver = true
    }

    removeLast = () => {
        if (this.gameOver) return
        this.currentChain.removeLast()
        if (this.currentChain.length === 0) {
            this.isTentative = false
        }
    }

    addTile = (index: number) => {
        if (this.gameOver) return
        const lastLetter = this.currentChain.last()

        if (lastLetter && index === lastLetter?.[0]) {
            this.currentChain.remove(index)

            return
        }

        const letterInChain = this.currentChain.get(index)

        if (letterInChain) {
            return
        }

        // not starting a new chain
        if (lastLetter) {
            const lastPosition = lastLetter[0]

            const validKeys = getAdjacentPositions(lastPosition)

            if (!validKeys.includes(index)) {
                console.log(`valid keys doesnt contain ${index}[${validKeys}]`)
                return
            }
        }

        const letter = this.letters[index]

        this.currentChain.add(index, letter)
    }

    submitWord = () => {
        if (this.gameOver) return
        const word = this.currentChain.getString()

        this.currentChain.clear()
        this.isTentative = false

        const notLongEnough = word.length < 3

        if (notLongEnough) {
            toastManager.addError("Not Long Enough")
            return
        }

        const alreadyFound = this.foundWords.includes(word)

        if (alreadyFound) {
            toastManager.addError("Word already found")
            return
        }

        const notInDict = !dictionaryManager.tryWord(word)

        if (notInDict) {
            toastManager.addError(`"${word}" is not in the word list`)
            return
        }

        this.foundWords.push(word)
        scoreManager.addWord(word)

    }

    findTileFromCharacter = (char: string, searchArea: [number, string][]) => {
        return searchArea.find(([_, letter]) => letter === char)
    }

    findPath = (chars: string[]): number[] | null => {
        if (chars.length === 0) return []

        const path: number[] = []

        const dfs = (charIdx: number): boolean => {
            if (charIdx === chars.length) return true

            const char = chars[charIdx]
            const candidates = charIdx === 0
                ? Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i)
                : getAdjacentPositions(path[path.length - 1])

            for (const pos of candidates) {
                if (path.includes(pos)) continue
                if (this.letters[pos] !== char) continue

                path.push(pos)
                if (dfs(charIdx + 1)) return true
                path.pop()
            }

            return false
        }

        return dfs(0) ? path : null
    }

    getSearchArea = (): [number, string][] => {
        if (this.currentChain.length === 0) {
            return this.letters
                .entries()
                .toArray()
        }

        return getAdjacentPositions(this.currentChain.last()![0])
            .map(index => [index, this.letters[index]] as [number, string])
            .filter(([index]) => !this.currentChain.containsKey(index))

    }

    inputChar = (char: string) => {
        if (this.gameOver) return
        const tile = this.findTileFromCharacter(char, this.getSearchArea())

        if (tile) {
            this.currentChain.add(tile[0], tile[1])
            this.isTentative = false
            return
        }

        const targetChars = [...this.currentChain].map(([_, l]) => l).concat(char)
        const path = this.findPath(targetChars)

        if (!path) return

        this.currentChain.clear()
        for (const index of path) {
            this.currentChain.add(index, this.letters[index])
        }
        this.isTentative = true
    }
}

const gameManager = new GameManager()

export default gameManager