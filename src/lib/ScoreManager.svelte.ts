import { SvelteMap } from "svelte/reactivity"
import toastManager from "./ToastManager.svelte"
import gameManager from "./GameManager.svelte"

export type ScoreItem = {
    points: number
    reason?: "ava bonus" | "length" | "dirty bonus"
}

const DIRTY_WORDS = [
    "sex", "dick", "balls", "sexy", "fruit", "anus", "cock", "hog", "horny", "hornier", "horniest", "doggy",
    "shit", "fuck", "ass", "bitch", "bastard", "cunt", "damn", "pussy", "tits",
    "boobs", "cum", "twat", "wank", "wanker", "prick", "crap", "dildo", "penis",
    "vagina", "nude", "naked", "porno", "porn", "piss", "scrotum", "testicle", "testicles", "fucker",
    "fucking", "shitty", "shitting", "bitching", "tit", "titty", "boner", "hooker", "nob", "hoe",
]

export type ScoreManagerInitData = {
    avasWords: null | string[],
    average: number
}

class ScoreManager {
    pointsMap = new SvelteMap<string, ScoreItem[]>([])
    totalWords!: string[]
    avasScore: number = 0
    avasWords: null | string[] = null
    totalPossibleScore!: number
    average: number = 0

    init = (totalWords: string[], scorePromise: Promise<ScoreManagerInitData>) => {
        this.totalWords = totalWords
        this.totalPossibleScore = totalWords.reduce((total, word) => total + this.wordLengthToPoints(word), 0)

        scorePromise.then(({ avasWords, average }) => {
            this.avasWords = avasWords
            this.avasScore = !avasWords
                ? 0
                : this.calculateTotalPoints(avasWords)
            this.average = average

            // recalculate any words already played before the promise resolved
            for (const [word, _] of this.pointsMap.entries()) {
                const { pointsArray } = this.calculatePoints(word);
                this.pointsMap.set(word, pointsArray);
            }
        }).catch(err => console.error("Score setup failed", err));
    }

    wordLengthToPoints = (word: string) => Math.floor(Math.pow(word.length, 2) / 4)

    calculateTotalPoints = (words: string[]) => words.reduce((total, word) => total + this.calculatePoints(word).points, 0)

    calculatePoints = (word: string) => {
        let points = 0;

        const lengthPoints = this.wordLengthToPoints(word)
        points += lengthPoints

        const pointsArray: ScoreItem[] = [{
            points: lengthPoints,
            reason: "length"
        }]

        if (this.avasWords && !this.avasWords.includes(word)) {
            points += 4
            pointsArray.push({
                points: 4,
                reason: "ava bonus"
            })
        }

        if (DIRTY_WORDS.includes(word)) {
            points += 7
            pointsArray.push({
                points: 7,
                reason: "dirty bonus"
            })
        }

        return {
            pointsArray,
            points
        }
    }

    addWord = (word: string) => {
        const { points, pointsArray: scoreArray } = this.calculatePoints(word)

        this.pointsMap.set(word, scoreArray)

        toastManager.addWordToast(
            word, scoreArray, points
        )
    }

    loadWord = (word: string) => {
        const { pointsArray: scoreArray } = this.calculatePoints(word)
        this.pointsMap.set(word, scoreArray)
    }

    getReveal = async () => {
        const postUrl = gameManager.playerState === "ava"
            ? "/api/avas-words"
            : "/api/player-words"

        const postHeaders = gameManager.playerState === "player"
            ? undefined
            : {
                "authorization": localStorage.getItem("admin_token") ?? ""
            }

        if (gameManager.foundWords.length > 0) {
            await fetch(postUrl, {
                method: "POST",
                body: JSON.stringify({
                    words: gameManager.foundWords,
                    dateKey: gameManager.dateKey
                }),
                headers: postHeaders
            })
        }


        const playerWordSet = new Set(gameManager.foundWords);
        const totalWordSet = new Set(gameManager.totalPossibleWords);

        const wordsMap: [string, boolean][] = gameManager.totalPossibleWords
            .toSorted()
            .map(word => [word, playerWordSet.has(word)])

        const playerScore = this.calculateTotalPoints(gameManager.foundWords)

        const scores = [
            ["You!", playerScore],
            ["Ava", this.avasScore],
            ["Average", this.average],
        ]

        const didWin = playerScore > this.avasScore

        return {
            wordsMap,
            totalWordSet,
            playerWordSet,
            scores,
            playerScore,
            avasScore: this.avasScore,
            didWin
        };
    }
}

const scoreManager = new ScoreManager()
export default scoreManager