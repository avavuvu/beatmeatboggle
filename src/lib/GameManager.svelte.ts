import { getAdjacentPositions } from "./constants"
export { getAdjacentPositions } from "./constants"
import toaster from "./Toaster.svelte"
import { scoreWord } from "./scoring"
import { checkWord, describeWordProblem } from "./checkWord"
import { findPath } from "./boardPath"
import Chain from "$lib/chain.svelte"
import { saveGameState, loadGameState } from "$lib/session"
import type { GameSession } from "./gameSession"

class GameManager {
    session: GameSession

    foundWords: string[] = $state([])
    currentChain = $state(new Chain())
    gameState: "playing" | "loading" | "gameOver" | "paused" | "backgrounded" =
        $state("loading")
    secondsLeft = $state(180)
    // fix for typing u after a Q (as Qu is bundled)
    #awaitingU = false

    #timerHandle: ReturnType<typeof setInterval> | undefined = undefined

    #averageGameScore: number | undefined = $state()

    get averageGameScore(): number | undefined {
        return this.#averageGameScore
    }
    set averageGameScore(score: number) {
        this.#averageGameScore = score
        this.save()
    }

    constructor(session: GameSession) {
        this.session = session

        this.secondsLeft = session.board.time

        this.foundWords = []
        this.currentChain.clear()

        this.load()
    }

    get isPaused() {
        return this.gameState === "paused" || this.gameState === "backgrounded"
    }

    stopTimer = () => {
        clearInterval(this.#timerHandle)
    }

    pause = () => {
        if (this.gameState !== "playing") return

        this.stopTimer()
        this.gameState = "paused"
        this.save()
    }

    suspend = () => {
        if (this.gameState !== "playing") return

        this.stopTimer()
        this.gameState = "backgrounded"
        this.save()
    }

    resume = () => {
        if (!this.isPaused) return

        this.startGame()
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

    endGame = async () => {
        this.gameState = "gameOver"
        this.save()

        if (this.session.playerState === "practice") {
            return
        }

        // Ava

        if (this.session.playerState === "ava") {
            const headers = {
                authorization: localStorage.getItem("admin_token") ?? "",
            }

            const _response = await fetch("/api/avas-words", {
                method: "POST",
                body: JSON.stringify({
                    words: this.foundWords,
                    dateKey: this.session.dateKey,
                }),
                headers,
            })

            return
        }

        // Player: the server recomputes the score from the words, so none is sent

        try {
            const response = await fetch("/api/player-words", {
                method: "POST",
                body: JSON.stringify({
                    words: this.foundWords,
                    dateKey: this.session.dateKey,
                    fairFight: this.session.match.fairFight,
                    playerId: this.session.playerId,
                    challengedBy: this.session.challengedBy,
                }),
            })

            if (!response.ok) {
                this.averageGameScore = 0
                return
            }

            const data: { average?: number } = await response.json()
            this.averageGameScore = data.average ?? 0
        } catch {
            this.averageGameScore = 0
        }
    }

    get isPlayingGame() {
        return this.gameState === "playing"
    }

    removeLast = () => {
        if (!this.isPlayingGame) return

        this.currentChain.removeLast()
        this.#awaitingU = false
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
                this.session.board.size
            )

            if (!validKeys.includes(index)) {
                return
            }
        }

        const letter = this.session.board.letters[index]

        this.currentChain.add(index, letter)
        this.#awaitingU = false
    }

    submitWord = () => {
        if (!this.isPlayingGame) return
        const word = this.currentChain.getString()

        if (word.length === 0) {
            return
        }

        this.currentChain.clear()
        this.#awaitingU = false

        const problem = checkWord({
            word,
            foundWords: this.foundWords,
            totalPossibleWords: this.session.totalPossibleWords,
        })

        if (problem) {
            toaster.addError(describeWordProblem({ word, problem }))
            return
        }

        this.foundWords.push(word)
        toaster.addWordToast({
            word,
            score: scoreWord({ word, match: this.session.match }),
            opponentName: this.session.opponentName,
        })
        this.save()
    }

    findTileFromCharacter = (char: string, searchArea: [number, string][]) => {
        return searchArea.find(([_, letter]) => letter === char)
    }

    getSearchArea = (): [number, string][] => {
        if (this.currentChain.length === 0) {
            return [...this.session.board.letters.entries()]
        }

        return getAdjacentPositions(
            this.currentChain.last()![0],
            this.session.board.size
        )
            .map(
                (index) =>
                    [index, this.session.board.letters[index]] as [
                        number,
                        string,
                    ]
            )
            .filter(([index]) => !this.currentChain.containsKey(index))
    }

    inputChar = (char: string) => {
        if (!this.isPlayingGame) return
        toaster.showToast = false

        if (char === "u" && this.#awaitingU) {
            this.#awaitingU = false
            return
        }
        this.#awaitingU = false

        const tile = this.findTileFromCharacter(char, this.getSearchArea())

        if (tile) {
            this.currentChain.add(tile[0], tile[1])
            this.#awaitingU = tile[1] === "q"
            return
        }

        const targetChars = [...this.currentChain]
            .map(([_, l]) => l)
            .concat(char)

        const path = findPath({
            tiles: targetChars,
            letters: this.session.board.letters,
            size: this.session.board.size,
        })

        if (!path) return

        this.currentChain.clear()
        for (const index of path) {
            this.currentChain.add(index, this.session.board.letters[index])
        }
        this.#awaitingU = char === "q"
    }

    #persists = () =>
        this.session.playerState === "player" ||
        this.session.playerState === "practice"

    save = () => {
        if (!this.#persists()) return

        saveGameState(this.session.saveKey, {
            foundWords: this.foundWords,
            secondsLeft: this.secondsLeft,
            gameOver: this.gameState === "gameOver",
            average: this.#averageGameScore,
        })
    }

    load = () => {
        if (!this.#persists()) return false

        const state = loadGameState(this.session.saveKey)
        if (!state) return false

        this.foundWords = state.foundWords
        this.secondsLeft = state.secondsLeft
        this.gameState = state.gameOver ? "gameOver" : "playing"

        if (state.average !== undefined) {
            this.averageGameScore = state.average
        }

        return true
    }
}

export default GameManager
