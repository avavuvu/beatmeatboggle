import { SvelteMap } from "svelte/reactivity"
import toaster from "./Toaster.svelte"
import preferences from "./Preferences.svelte"
import { encodeChallenge } from "./challenge/challengeToken"

export type ScoreItem = {
    points: number
    reason?: "opponent bonus" | "length" | "dirty bonus" | "unique"
}

const DIRTY_WORDS = [
    "sex",
    "dick",
    "balls",
    "sexy",
    "anus",
    "cock",
    "horny",
    "hornier",
    "horniest",
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
    "hoe",
    "gonad",
    "gonads",
]

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
            const reason = fairFight ? "unique" : "opponent bonus"

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
                this.opponentWords || [],
                true,
                this.fairFight
            )

        this.pointsMap.set(word, scoreArray)

        toaster.addWordToast(word, scoreArray, points, this.opponentName)
    }

    loadWord = (word: string) => {
        const { pointsArray: scoreArray } = ScoreTracker.calculatePoints(
            word,
            this.opponentWords || [],
            true,
            this.fairFight
        )
        this.pointsMap.set(word, scoreArray)
    }

    getReveal = (foundWords: string[], totalPossibleWords: string[]) => {
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
            .map((word) => [word, !opponentWordSet.has(word)])

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
            this.fairFight
        )

        if (this.fairFight) {
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

        const didWin = playerScore > this.opponentScore

        return {
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
