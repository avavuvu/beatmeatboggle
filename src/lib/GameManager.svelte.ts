import { solve } from "./dictionary/solver"
import dictionaryManager from "./dictionary/DictionaryManager.svelte"
import { getAdjacentPositions } from "./constants"
export { getAdjacentPositions } from "./constants"
import toaster from "./Toaster.svelte"
import scoreTracker, { ScoreTracker } from "./ScoreTracker.svelte"
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
        session: GameSession,
        opponentWords: string[] | null,
        opponentName: string = "Ava"
    ) {
        this.session = session

        this.secondsLeft = session.board.time

        this.foundWords = []
        this.currentChain.clear()

        this.load()

        scoreTracker.init(
            session.totalPossibleWords,
            opponentWords,
            opponentName,
            session.challengedBy !== null
        )
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
                    totalWords: this.session.totalPossibleWords,
                }),
                headers,
            })

            return
        }

        // Player

        if (this.foundWords.length > 0) {
            const fairFight = scoreTracker.fairFight
            const score = ScoreTracker.calculateTotalPoints(
                this.foundWords,
                scoreTracker.opponentWords || [],
                true,
                fairFight
            )

            const response = await fetch("/api/player-words", {
                method: "POST",
                body: JSON.stringify({
                    words: this.foundWords,
                    dateKey: this.session.dateKey,
                    score,
                    fairFight,
                    playerId: this.session.playerId,
                    challengedBy: this.session.challengedBy,
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
                this.session.board.size
            )

            if (!validKeys.includes(index)) {
                return
            }
        }

        const letter = this.session.board.letters[index]

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
                          {
                              length:
                                  this.session.board.size *
                                  this.session.board.size,
                          },
                          (_, i) => i
                      )
                    : getAdjacentPositions(
                          path[path.length - 1],
                          this.session.board.size
                      )

            for (const pos of candidates) {
                if (path.includes(pos)) continue
                if (this.session.board.letters[pos] !== char) continue

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
            return this.session.board.letters.entries().toArray()
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
            this.currentChain.add(index, this.session.board.letters[index])
        }
        this.isTentative = true
    }

    save = () => {
        if (this.session.playerState !== "player") return

        saveGameState(this.session.dateKey, {
            foundWords: this.foundWords,
            secondsLeft: this.secondsLeft,
            gameOver: this.gameState === "gameOver",
            average: this.#averageGameScore,
        })
    }

    load = () => {
        if (this.session.playerState !== "player") return false

        const state = loadGameState(this.session.dateKey)
        if (!state) return false

        this.foundWords = state.foundWords
        this.secondsLeft = state.secondsLeft
        this.gameState = state.gameOver ? "gameOver" : "playing"

        if (state.average !== undefined) {
            this.averageGameScore = state.average
        }

        for (const word of this.foundWords) {
            scoreTracker.loadWord(word)
        }

        return true
    }
}

export default GameManager
