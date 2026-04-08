import { SvelteMap } from "svelte/reactivity"
import toastManager from "./ToastManager.svelte"
import gameManager from "./GameManager.svelte"
import { browser } from "$app/environment"
import { page } from "$app/state"

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
    avasScore: number = $state(0)
    avasWords: null | string[] = $state(null)
    totalPossibleScore!: number
    average: number = $state(0)

    init = (totalWords: string[]) => {
        this.totalWords = totalWords
        this.totalPossibleScore = totalWords.reduce((total, word) => total + this.wordLengthToPoints(word), 0)

        const scoreData = browser && localStorage.getItem(`scores_${gameManager.dateKey}`);
        if (scoreData) {
            const {
                average, avasWords
            }: ScoreManagerInitData = JSON.parse(scoreData)

            this.avasWords = avasWords
            this.avasScore = !avasWords
                ? 0
                : this.calculateTotalPoints(avasWords)

            this.average = average
        } else {
            const fetchScores = async (): Promise<ScoreManagerInitData> => {
                const res = await fetch(`/api/player-words?dateKey=${gameManager.dateKey}`, {
                    method: "GET",
                });

                return res.json();
            }

            fetchScores().then(({ avasWords, average }) => {
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

                localStorage.setItem(`scores_${gameManager.dateKey}`, JSON.stringify({
                    avasWords: this.avasWords,
                    average: this.average
                }));
            }).catch(err => console.error("Score setup failed", err));
        }
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
        const avasWordSet = new Set(this.avasWords || []);

        const sortWords = (words: string[]): [string, boolean][] => words
            .toSorted()
            .map(word => [word, playerWordSet.has(word)])

        // words ava found
        const avasWordMap = this.avasWords ? sortWords(this.avasWords) : []

        // other words
        const totalWordsMap = sortWords(gameManager.totalPossibleWords)
            .filter(word => !avasWordSet.has(word[0]))

        const playerScore = this.calculateTotalPoints(gameManager.foundWords)

        const scores = [
            ["You!", playerScore],
            ["Ava", this.avasScore],
            ["Average", this.average],
        ]

        const didWin = playerScore > this.avasScore

        return {
            avasWordMap,
            totalWordsMap,
            totalWordSet,
            playerWordSet,
            scores,
            playerScore,
            avasScore: this.avasScore,
            didWin,
            shareLink: this.createShareLink(playerScore, this.avasScore)
        };
    }

    createShareLink = (totalScore: number, avasScore: number) => {
        const generateChecksum = (str: string) => {
            let check = 0x12345678;
            for (let i = 0; i < str.length; i++) {
                check += str.charCodeAt(i) * (i + 1);
            }

            return (check & 0xffffffff).toString(16);
        };

        const size = gameManager.gridSize
        const letters = gameManager.letters.join("")

        const checksum = generateChecksum(`${size}${letters}${totalScore}${avasScore}`);

        const url = new URL(page.url.origin + "/badge")
        url.searchParams.append("l", letters)
        url.searchParams.append("s", `${totalScore}`)
        url.searchParams.append("a", `${avasScore}`)
        url.searchParams.append("z", `${size}`)
        url.searchParams.append("c", checksum)


        return url.toString()
    }
}

const scoreManager = new ScoreManager()
export default scoreManager