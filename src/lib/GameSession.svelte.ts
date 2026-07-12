import { solve } from "./dictionary/solver"
import dictionaryManager from "./dictionary/DictionaryManager.svelte"
import {
    getAdjacentPositions,
    toISODateKey,
    type PlayerState,
    type AvasPayload,
} from "./constants"
import toaster from "./Toaster.svelte"
import scoreTracker, { ScoreTracker } from "./ScoreTracker.svelte"
import { browser } from "$app/environment"
import preferences from "./Preferences.svelte"
export { getAdjacentPositions } from "./constants"
import { GAME_KEY_PREFIX } from "./constants"
import Chain from "$lib/chain.svelte"
import {
    getBoardSettings,
    rerollBoard,
    type BoardSettings,
} from "./boardSettings"

class GameSession {
    foundWords: string[] = $state([])
    currentChain = $state(new Chain())
    totalPossibleWords: string[] = $state([])
    gameState: "playing" | "loading" | "gameOver" = $state("loading")
    playerState: PlayerState = $state("player")
    dateKey: string = $state("")

    avasPayload: AvasPayload | null = null

    board: BoardSettings = $state(undefined!)
    secondsLeft = $state(180)

    isTentative: boolean = $state(false)

    #timerHandle: ReturnType<typeof setInterval> | undefined = undefined

    #averageGameScore: number | undefined = $state()

    get averageGameScore(): number | undefined {
        return this.#averageGameScore
    }
    set averageGameScore(score: number) {
        this.#averageGameScore = score
        this.save()
    }

    constructor(
        date: Date,
        playerState: PlayerState,
        avasPayload: AvasPayload | null
    ) {
        this.dateKey = toISODateKey(date)
        this.playerState = playerState
        this.avasPayload = avasPayload

        this.board = getBoardSettings(date)

        // QUICK FIX: DO PROPER FIX LATER
        const initialWords = [...solve(this.board.letters, this.board.size)]
        if (initialWords.length < 130) {
            this.board = rerollBoard(date)
        }

        if (!avasPayload?.totalWords) {
            this.totalPossibleWords = [
                ...solve(this.board.letters, this.board.size),
            ]
        } else {
            this.totalPossibleWords = avasPayload.totalWords
        }

        this.secondsLeft = this.board.time

        this.foundWords = []
        this.currentChain.clear()

        this.load()

        scoreTracker.init(
            this.totalPossibleWords,
            this.dateKey,
            avasPayload?.words ?? null
        )
    }

    stopTimer = () => {
        clearInterval(this.#timerHandle)
    }

    startGame = () => {
        this.gameState = "playing"

        clearInterval(this.#timerHandle)

        this.#timerHandle = setInterval(async () => {
            this.secondsLeft -= 1
            if (this.secondsLeft <= 0) {
                this.secondsLeft = 0
                clearInterval(this.#timerHandle)

                await this.endGame()
            }

            this.save()
        }, 1000)
    }

    submitAva = async (message: string, image: File | Blob | null) => {
        const headers = {
            authorization: localStorage.getItem("admin_token") ?? "",
        }

        const formData = new FormData()
        formData.set("words", JSON.stringify(this.foundWords))
        formData.set("dateKey", this.dateKey)
        formData.set("totalWords", JSON.stringify(this.totalPossibleWords))
        formData.set("message", message)
        if (image) {
            formData.set("image", image)
        }

        const _response = await fetch("/api/avas-words", {
            method: "POST",
            body: formData,
            headers,
        })

        return
    }

    endGame = async () => {
        this.gameState = "gameOver"
        this.save()

        if (this.playerState === "ava") {
            return
        }

        // Player, ava handled not at game end to support messages
        if (this.foundWords.length > 0) {
            const fairFight = preferences.settings.fairFight.value
            const score = ScoreTracker.calculateTotalPoints(
                this.foundWords,
                scoreTracker.avasWords || [],
                true,
                fairFight
            )

            const response = await fetch("/api/player-words", {
                method: "POST",
                body: JSON.stringify({
                    words: this.foundWords,
                    dateKey: this.dateKey,
                    score,
                    fairFight,
                }),
            })

            const data: {
                success: boolean
                average: number
            } = await response.json()

            if (data?.average) {
                this.averageGameScore = data.average
            }
        }
    }

    get isPlayingGame() {
        return this.gameState === "playing"
    }

    removeLast = () => {
        if (!this.isPlayingGame) return

        this.currentChain.removeLast()
        if (this.currentChain.length === 0) {
            this.isTentative = false
        }
    }

    addTile = (index: number) => {
        if (!this.isPlayingGame) return

        const lastLetter = this.currentChain.last()

        if (lastLetter && index === lastLetter?.[0]) {
            this.currentChain.remove(index)

            return
        }

        const letterInChain = this.currentChain.get(index)

        if (letterInChain) {
            return
        }

        if (lastLetter) {
            const lastPosition = lastLetter[0]

            const validKeys = getAdjacentPositions(
                lastPosition,
                this.board.size
            )

            if (!validKeys.includes(index)) {
                return
            }
        }

        const letter = this.board.letters[index]

        this.currentChain.add(index, letter)
    }

    submitWord = () => {
        if (!this.isPlayingGame) return
        const word = this.currentChain.getString()

        if (word.length === 0) {
            return
        }

        this.currentChain.clear()
        this.isTentative = false

        const notLongEnough = word.length < 3

        if (notLongEnough) {
            toaster.addError(`${word} is not long enough`)
            return
        }

        const alreadyFound = this.foundWords.includes(word)

        if (alreadyFound) {
            toaster.addError("Word already found")
            return
        }

        const notInDict = !dictionaryManager.tryWord(word)

        if (notInDict) {
            toaster.addError(`"${word}" is not in the word list`)
            return
        }

        this.foundWords.push(word)
        scoreTracker.addWord(word)
        this.save()
    }

    findTileFromCharacter = (char: string, searchArea: [number, string][]) => {
        return searchArea.find(([_, letter]) => letter === char)
    }

    findPath = (chars: string[]): number[] | null => {
        if (chars.length === 0) return []

        const path: number[] = []

        const dfs = (charIndex: number): boolean => {
            if (charIndex === chars.length) return true

            const char = chars[charIndex]
            const candidates =
                charIndex === 0
                    ? Array.from(
                          { length: this.board.size * this.board.size },
                          (_, i) => i
                      )
                    : getAdjacentPositions(
                          path[path.length - 1],
                          this.board.size
                      )

            for (const pos of candidates) {
                if (path.includes(pos)) continue
                if (this.board.letters[pos] !== char) continue

                path.push(pos)
                if (dfs(charIndex + 1)) return true
                path.pop()
            }

            return false
        }

        return dfs(0) ? path : null
    }

    getSearchArea = (): [number, string][] => {
        if (this.currentChain.length === 0) {
            return this.board.letters.entries().toArray()
        }

        return getAdjacentPositions(
            this.currentChain.last()![0],
            this.board.size
        )
            .map(
                (index) =>
                    [index, this.board.letters[index]] as [number, string]
            )
            .filter(([index]) => !this.currentChain.containsKey(index))
    }

    inputChar = (char: string) => {
        if (!this.isPlayingGame) return
        toaster.showToast = false

        const tile = this.findTileFromCharacter(char, this.getSearchArea())

        if (tile) {
            this.currentChain.add(tile[0], tile[1])
            this.isTentative = false
            return
        }

        const targetChars = [...this.currentChain]
            .map(([_, l]) => l)
            .concat(char)

        const path = this.findPath(targetChars)

        if (!path) return

        this.currentChain.clear()
        for (const index of path) {
            this.currentChain.add(index, this.board.letters[index])
        }
        this.isTentative = true
    }

    save = () => {
        if (!browser || this.playerState !== "player") return
        localStorage.setItem(
            `${GAME_KEY_PREFIX}${this.dateKey}`,
            JSON.stringify({
                foundWords: this.foundWords,
                secondsLeft: this.secondsLeft,
                gameOver: this.gameState === "gameOver",
                average: this.#averageGameScore,
            })
        )
    }

    load = () => {
        if (!browser || this.playerState !== "player") return false

        const saved = localStorage.getItem(`${GAME_KEY_PREFIX}${this.dateKey}`)
        if (saved) {
            const parsed = JSON.parse(saved)

            this.foundWords = parsed.foundWords
            this.secondsLeft = parsed.secondsLeft
            this.gameState = parsed.gameOver ? "gameOver" : "playing"

            if ("average" in parsed) {
                this.averageGameScore = parsed.average
            }

            for (const word of this.foundWords) {
                scoreTracker.loadWord(word)
            }

            return true
        }

        return false
    }
}

export default GameSession
