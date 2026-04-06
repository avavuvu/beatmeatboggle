import { SvelteMap } from "svelte/reactivity"
import toastManager from "./ToastManager.svelte"
import gameManager from "./GameManager.svelte"

export type ScoreItem = {
    points: number
    reason?: "ava bonus" | "length" | "dirty bonus"
}

const DIRTY_WORDS = [
    "sex", "dick", "balls", "sexy", "fruit", "anus", "cock", "hog", "horny", "hornier", "horniest", "doggy"
]

class ScoreManager {
    pointsMap = new SvelteMap<string, ScoreItem[]>([])
    totalWords!: string[]
    avasScore!: number
    avasWords!: null | string[]
    totalPossibleScore!: number
    histogram!: {
        [k: string]: number;
    }

    init = (totalWords: string[], avasWords: null | string[], histogram: {
        [k: string]: number;
    }) => {
        this.avasWords = avasWords
        this.totalWords = totalWords
        this.avasScore = !avasWords
            ? 0
            : avasWords.reduce((total, word) => total + this.calculatePoints(word).points, 0)
        this.totalPossibleScore = totalWords.reduce((total, word) => total + this.wordLengthToPoints(word), 0)
        this.histogram = histogram
    }

    wordLengthToPoints = (word: string) => Math.floor(Math.pow(word.length, 2) / 4)

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

    getReveal = async () => {
        const postUrl = gameManager.playerState === "ava"
            ? "/api/avas-words"
            : "/api/player-words"

        const postHeaders = gameManager.playerState === "player"
            ? undefined
            : {
                "authorization": localStorage.getItem("admin_token") ?? ""
            }

        console.log(postHeaders)

        await fetch(postUrl, {
            method: "POST",
            body: JSON.stringify({
                words: gameManager.foundWords,
                dateKey: gameManager.dateKey
            }),
            headers: postHeaders
        })

        const playerWordSet = new Set(gameManager.foundWords);
        const totalWordSet = new Set(gameManager.totalPossibleWords);

        const wordsMap: [string, boolean][] = gameManager.totalPossibleWords
            .toSorted()
            .map(word => [word, playerWordSet.has(word)])

        const playerScore = gameManager.foundWords.reduce((total, word) => total + this.calculatePoints(word).points, 0)

        const scores: [string, number][] = [
            ["You!", playerScore],
            ["Average", this.avasScore - 10],
            ["Ava", this.avasScore],
        ];

        const didWin = playerScore > this.avasScore

        return {
            wordsMap,
            totalWordSet,
            playerWordSet,
            scores,
            didWin
        };
    }
}

const scoreManager = new ScoreManager()
export default scoreManager