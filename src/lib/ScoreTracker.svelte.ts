import { SvelteMap } from "svelte/reactivity"
import toaster from "./Toaster.svelte"
import preferences from "./Preferences.svelte"
import { encodeChallenge } from "./challenge/challengeToken"
import {
    calculatePoints,
    calculateTotalPoints,
    wordLengthToPoints,
    type ScoreItem,
} from "./scoring"

export type { ScoreItem }

class ScoreTracker {
    pointsMap = new SvelteMap<string, ScoreItem[]>([])
    totalWords!: string[]
    opponentScore: number = $state(0)
    opponentWords: null | string[] = $state(null)
    opponentName: string = $state("Ava")
    forceFairFight: boolean = $state(false)
    totalPossibleScore!: number

    get fairFight(): boolean {
        return this.forceFairFight || preferences.settings.fairFight.value
    }

    get hasComparison(): boolean {
        return this.opponentWords !== null
    }

    init = (
        totalWords: string[],
        opponentWords: string[] | null,
        opponentName: string = "Ava",
        forceFairFight: boolean = false
    ) => {
        this.totalWords = totalWords
        this.totalPossibleScore = totalWords.reduce(
            (total, word) => total + ScoreTracker.wordLengthToPoints(word),
            0
        )

        this.opponentWords = opponentWords
        this.opponentName = opponentName
        this.forceFairFight = forceFairFight
        this.opponentScore = !opponentWords
            ? 0
            : ScoreTracker.calculateTotalPoints(
                  opponentWords,
                  [],
                  false,
                  this.fairFight
              )
    }

    static wordLengthToPoints = wordLengthToPoints

    static calculateTotalPoints = calculateTotalPoints

    static calculatePoints = calculatePoints

    addWord = (word: string) => {
        const { points, pointsArray: scoreArray } =
            ScoreTracker.calculatePoints(
                word,
                this.opponentWords || [],
                true,
                this.fairFight,
                this.hasComparison
            )

        this.pointsMap.set(word, scoreArray)

        toaster.addWordToast(word, scoreArray, points, this.opponentName)
    }

    loadWord = (word: string) => {
        const { pointsArray: scoreArray } = ScoreTracker.calculatePoints(
            word,
            this.opponentWords || [],
            true,
            this.fairFight,
            this.hasComparison
        )
        this.pointsMap.set(word, scoreArray)
    }

    getReveal = (foundWords: string[], totalPossibleWords: string[]) => {
        const hasComparison = this.hasComparison
        const playerWordSet = new Set(foundWords)
        const totalWordSet = new Set(totalPossibleWords)
        const opponentWordSet = new Set(this.opponentWords || [])

        type WordMap = [string, boolean][]

        const opponentWordMap: WordMap = this.opponentWords
            ? this.opponentWords
                  .toSorted()
                  .map((word) => [word, playerWordSet.has(word)])
            : []

        const playerWordMap: WordMap = foundWords
            .toSorted()
            .map((word) => [word, hasComparison && !opponentWordSet.has(word)])

        const totalWordsMap: WordMap = totalPossibleWords
            .toSorted()
            .filter(
                (word) => !opponentWordSet.has(word) && !playerWordSet.has(word)
            )
            .map((word) => [word, false])

        const playerScore = ScoreTracker.calculateTotalPoints(
            foundWords,
            this.opponentWords || [],
            true,
            this.fairFight,
            hasComparison
        )

        if (hasComparison && this.fairFight) {
            this.opponentScore = ScoreTracker.calculateTotalPoints(
                this.opponentWords || [],
                foundWords,
                true,
                this.fairFight
            )
        }

        const scores = {
            you: playerScore,
            opponent: this.opponentScore,
        }

        const didWin = hasComparison ? playerScore > this.opponentScore : null

        return {
            hasComparison,
            opponentWordMap,
            playerWordMap,
            totalWordsMap,
            totalWordSet,
            scores,
            playerScore,
            didWin,
            opponentName: this.opponentName,
        }
    }
}

const scoreTracker = new ScoreTracker()
export { ScoreTracker }
export default scoreTracker
