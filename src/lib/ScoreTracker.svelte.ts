import { SvelteMap } from "svelte/reactivity"
import toaster from "./Toaster.svelte"
import preferences from "./Preferences.svelte"

export type ScoreItem = {
    points: number
    reason?: "ava bonus" | "length" | "dirty bonus" | "unique"
}

const DIRTY_WORDS = [
    "sex",
    "dick",
    "balls",
    "sexy",
    "fruit",
    "anus",
    "cock",
    "hog",
    "horny",
    "hornier",
    "horniest",
    "doggy",
    "shit",
    "fuck",
    "ass",
    "bitch",
    "bastard",
    "cunt",
    "damn",
    "pussy",
    "tits",
    "boobs",
    "cum",
    "twat",
    "wank",
    "wanker",
    "prick",
    "crap",
    "dildo",
    "penis",
    "vagina",
    "nude",
    "naked",
    "porno",
    "porn",
    "piss",
    "scrotum",
    "testicle",
    "testicles",
    "fucker",
    "fucking",
    "shitty",
    "shitting",
    "bitching",
    "tit",
    "titty",
    "boner",
    "hooker",
    "nob",
    "hoe",
]

class ScoreTracker {
    pointsMap = new SvelteMap<string, ScoreItem[]>([])
    totalWords!: string[]
    avasScore: number = $state(0)
    avasWords: null | string[] = $state(null)
    totalPossibleScore!: number

    #dateKey: string = ""

    init = (
        totalWords: string[],
        dateKey: string,
        avasWords: string[] | null
    ) => {
        this.#dateKey = dateKey
        this.totalWords = totalWords
        this.totalPossibleScore = totalWords.reduce(
            (total, word) => total + ScoreTracker.wordLengthToPoints(word),
            0
        )

        this.avasWords = avasWords
        this.avasScore = !avasWords
            ? 0
            : ScoreTracker.calculateTotalPoints(
                  avasWords,
                  [],
                  false,
                  preferences.settings.fairFight.value
              )
    }

    static wordLengthToPoints = (word: string) =>
        Math.floor(Math.pow(word.length, 2) / 4)

    static calculateTotalPoints = (
        words: string[],
        otherPlayersWords: string[],
        awardUniqueBonus: boolean,
        fairFight: boolean
    ) =>
        words.reduce(
            (total, word) =>
                total +
                ScoreTracker.calculatePoints(
                    word,
                    otherPlayersWords,
                    awardUniqueBonus,
                    fairFight
                ).points,
            0
        )

    static calculatePoints = (
        word: string,
        otherPlayersWords: string[],
        awardUniqueBonus: boolean,
        fairFight: boolean
    ) => {
        let points = 0

        const lengthPoints = ScoreTracker.wordLengthToPoints(word)
        points += lengthPoints

        const pointsArray: ScoreItem[] = [
            {
                points: lengthPoints,
                reason: "length",
            },
        ]

        if (awardUniqueBonus && !otherPlayersWords.includes(word)) {
            const reason = fairFight ? "unique" : "ava bonus"

            points += 1
            pointsArray.push({
                points: 1,
                reason,
            })
        }

        if (DIRTY_WORDS.includes(word)) {
            points += 4
            pointsArray.push({
                points: 4,
                reason: "dirty bonus",
            })
        }

        return {
            pointsArray,
            points,
        }
    }

    addWord = (word: string) => {
        const { points, pointsArray: scoreArray } =
            ScoreTracker.calculatePoints(
                word,
                this.avasWords || [],
                true,
                preferences.settings.fairFight.value
            )

        this.pointsMap.set(word, scoreArray)

        toaster.addWordToast(word, scoreArray, points)
    }

    loadWord = (word: string) => {
        const { pointsArray: scoreArray } = ScoreTracker.calculatePoints(
            word,
            this.avasWords || [],
            true,
            preferences.settings.fairFight.value
        )
        this.pointsMap.set(word, scoreArray)
    }

    getReveal = (foundWords: string[], totalPossibleWords: string[]) => {
        const playerWordSet = new Set(foundWords)
        const totalWordSet = new Set(totalPossibleWords)
        const avasWordSet = new Set(this.avasWords || [])

        const avasWordMap: [string, boolean][] = this.avasWords
            ? this.avasWords
                  .toSorted()
                  .map((word) => [word, playerWordSet.has(word)])
            : []

        const playerWordMap: [string, boolean][] = foundWords
            .toSorted()
            .map((word) => [word, !avasWordSet.has(word)])

        const totalWordsMap: [string, boolean][] = totalPossibleWords
            .toSorted()
            .filter(
                (word) => !avasWordSet.has(word) && !playerWordSet.has(word)
            )
            .map((word) => [word, false])

        const playerScore = ScoreTracker.calculateTotalPoints(
            foundWords,
            this.avasWords || [],
            true,
            preferences.settings.fairFight.value
        )

        if (preferences.settings.fairFight.value) {
            this.avasScore = ScoreTracker.calculateTotalPoints(
                this.avasWords || [],
                foundWords,
                true,
                preferences.settings.fairFight.value
            )
        }

        const scores = {
            you: playerScore,
            ava: this.avasScore,
        }

        const didWin = playerScore > this.avasScore

        return {
            avasWordMap,
            playerWordMap,
            totalWordsMap,
            totalWordSet,
            scores,
            playerScore,
            avasScore: this.avasScore,
            didWin,
        }
    }
}

const scoreTracker = new ScoreTracker()
export { ScoreTracker }
export default scoreTracker
