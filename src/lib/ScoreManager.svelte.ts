import { SvelteMap } from "svelte/reactivity"
import toastManager from "./ToastManager.svelte"
import gameManager from "./GameManager.svelte"
import { browser } from "$app/environment"
import { page } from "$app/state"
import settingsManager from "./SettingsManager.svelte"
import streakManager from "./StreakManager.svelte"
import { SCORE_KEY_PREFIX } from "./constants"

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

export type ScoreManagerInitData = {
    avasWords: null | string[]
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
        this.totalPossibleScore = totalWords.reduce(
            (total, word) => total + ScoreManager.wordLengthToPoints(word),
            0
        )

        const scoreData =
            browser &&
            localStorage.getItem(`${SCORE_KEY_PREFIX}${gameManager.dateKey}`)
        if (scoreData) {
            const { average, avasWords }: ScoreManagerInitData =
                JSON.parse(scoreData)

            this.avasWords = avasWords
            this.avasScore = !avasWords
                ? 0
                : ScoreManager.calculateTotalPoints(
                      avasWords,
                      [],
                      false,
                      settingsManager.settings.fairFight.value
                  )

            this.average = average
        } else {
            const fetchScores = async (): Promise<ScoreManagerInitData> => {
                const res = await fetch(
                    `/api/player-words?dateKey=${gameManager.dateKey}`,
                    {
                        method: "GET",
                    }
                )

                return res.json()
            }

            fetchScores()
                .then(({ avasWords, average }) => {
                    this.avasWords = avasWords
                    this.avasScore = !avasWords
                        ? 0
                        : ScoreManager.calculateTotalPoints(
                              avasWords,
                              [],
                              false,
                              settingsManager.settings.fairFight.value
                          )
                    this.average = average

                    // recalculate any words already played before the promise resolved
                    for (const [word, _] of this.pointsMap.entries()) {
                        const { pointsArray } = ScoreManager.calculatePoints(
                            word,
                            [],
                            true,
                            settingsManager.settings.fairFight.value
                        )
                        this.pointsMap.set(word, pointsArray)
                    }

                    localStorage.setItem(
                        `${SCORE_KEY_PREFIX}${gameManager.dateKey}`,
                        JSON.stringify({
                            avasWords: this.avasWords,
                            average: this.average,
                        })
                    )
                })
                .catch((err) => console.error("Score setup failed", err))
        }
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
                ScoreManager.calculatePoints(
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

        const lengthPoints = ScoreManager.wordLengthToPoints(word)
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

            console.log("unique word bonus for", word)
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
            ScoreManager.calculatePoints(
                word,
                this.avasWords || [],
                true,
                settingsManager.settings.fairFight.value
            )

        this.pointsMap.set(word, scoreArray)

        toastManager.addWordToast(word, scoreArray, points)
    }

    loadWord = (word: string) => {
        const { pointsArray: scoreArray } = ScoreManager.calculatePoints(
            word,
            this.avasWords || [],
            true,
            settingsManager.settings.fairFight.value
        )
        this.pointsMap.set(word, scoreArray)
    }

    getReveal = async () => {
        const postUrl =
            gameManager.playerState === "ava"
                ? "/api/avas-words"
                : "/api/player-words"

        const postHeaders =
            gameManager.playerState === "player"
                ? undefined
                : {
                      authorization: localStorage.getItem("admin_token") ?? "",
                  }

        if (gameManager.foundWords.length > 0) {
            await fetch(postUrl, {
                method: "POST",
                body: JSON.stringify({
                    words: gameManager.foundWords,
                    dateKey: gameManager.dateKey,
                }),
                headers: postHeaders,
            })
        }

        const playerWordSet = new Set(gameManager.foundWords)
        const totalWordSet = new Set(gameManager.totalPossibleWords)
        const avasWordSet = new Set(this.avasWords || [])

        // words ava found, marked true if the player also found them
        const avasWordMap: [string, boolean][] = this.avasWords
            ? this.avasWords
                  .toSorted()
                  .map((word) => [word, playerWordSet.has(word)])
            : []

        // words the player found, marked true if Ava did NOT find them (unique to player)
        const playerWordMap: [string, boolean][] = gameManager.foundWords
            .toSorted()
            .map((word) => [word, !avasWordSet.has(word)])

        // words neither ava nor the player found
        const totalWordsMap: [string, boolean][] =
            gameManager.totalPossibleWords
                .toSorted()
                .filter(
                    (word) => !avasWordSet.has(word) && !playerWordSet.has(word)
                )
                .map((word) => [word, false])

        const playerScore = ScoreManager.calculateTotalPoints(
            gameManager.foundWords,
            this.avasWords || [],
            true,
            settingsManager.settings.fairFight.value
        )

        // recalculate ava's score if there is a fair fight
        if (settingsManager.settings.fairFight.value) {
            this.avasScore = ScoreManager.calculateTotalPoints(
                this.avasWords || [],
                gameManager.foundWords,
                true,
                settingsManager.settings.fairFight.value
            )
        }

        const scores = [
            ["You!", playerScore],
            ["Ava", this.avasScore],
            ["Average", this.average],
        ]

        const didWin = playerScore > this.avasScore

        // if (gameManager.playerState === "player") {
        //     streakManager.saveResult(
        //         gameManager.dateKey,
        //         playerScore,
        //         this.avasScore,
        //         didWin,
        //         settingsManager.settings.fairFight.value
        //     )
        // }

        return {
            avasWordMap,
            playerWordMap,
            totalWordsMap,
            totalWordSet,
            scores,
            playerScore,
            avasScore: this.avasScore,
            didWin,
            shareLink: this.createShareLink(playerScore, this.avasScore),
        }
    }

    createShareLink = (totalScore: number, avasScore: number) => {
        const generateChecksum = (str: string) => {
            let check = 0x12345678
            for (let i = 0; i < str.length; i++) {
                check += str.charCodeAt(i) * (i + 1)
            }

            return (check & 0xffffffff).toString(16)
        }

        const size = gameManager.gridSize
        const letters = gameManager.letters.join("")

        const checksum = generateChecksum(
            `${size}${letters}${totalScore}${avasScore}`
        )

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
export { ScoreManager }
export default scoreManager
