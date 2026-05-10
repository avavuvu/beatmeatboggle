import { browser } from "$app/environment"
import {
    toISODateKey,
    RESULT_KEY_PREFIX,
    SCORE_KEY_PREFIX,
    GAME_KEY_PREFIX,
} from "./constants"
import { ScoreManager } from "./ScoreManager.svelte"

export type DayResult = {
    playerScore: number
    avasScore: number
    didWin: boolean
    fairFight: boolean
}

const MIGRATION_FLAG = "streak_migrated_v1"
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

class StreakManager {
    currentStreak: number = $state(0)
    bestStreak: number = $state(0)
    currentWinStreak: number = $state(0)
    bestWinStreak: number = $state(0)
    playedToday: boolean = $state(false)
    wonToday: boolean = $state(false)
    totalPlayed: number = $state(0)
    totalWon: number = $state(0)

    constructor() {
        if (!browser) return
        this.migrate()
        this.compute(new Date())
    }

    private shiftDate = (dateKey: string, days: number): string => {
        const d = new Date(`${dateKey}T00:00:00`)
        d.setDate(d.getDate() + days)
        return toISODateKey(d)
    }

    /**
     * Reconstruct player and Ava scores from raw word lists for migration.
     */
    private computeScores = (
        playerWords: string[],
        avasWords: string[]
    ): { playerScore: number; avasScore: number } => {
        const avasWordSet = new Set(avasWords)
        const playerScore = ScoreManager.calculateTotalPoints(
            playerWords,
            avasWords,
            true,
            false
        )
        const avasScore = ScoreManager.calculateTotalPoints(
            avasWords,
            [],
            false,
            false
        )

        return { playerScore, avasScore }
    }

    // ── Public API ───────────────────────────────────────────────────────────

    getResult = (dateKey: string): DayResult | null => {
        if (!browser) return null
        const raw = localStorage.getItem(`${RESULT_KEY_PREFIX}${dateKey}`)
        if (!raw) return null
        try {
            return JSON.parse(raw) as DayResult
        } catch {
            return null
        }
    }

    /**
     * Persist the final game result for a date and recompute all streaks.
     * Called by ScoreManager at the end of getReveal().
     */
    saveResult = (
        dateKey: string,
        playerScore: number,
        avasScore: number,
        didWin: boolean,
        fairFight: boolean
    ) => {
        if (!browser) return
        const result: DayResult = { playerScore, avasScore, didWin, fairFight }
        localStorage.setItem(
            `${RESULT_KEY_PREFIX}${dateKey}`,
            JSON.stringify(result)
        )
        this.compute(new Date())
    }

    /**
     * One-off migration
     */
    migrate = () => {
        // already migrated, ignore
        if (!browser || localStorage.getItem(MIGRATION_FLAG)) return

        const gameKeys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith(GAME_KEY_PREFIX)) gameKeys.push(key)
        }

        for (const key of gameKeys) {
            const dateKey = key.slice(GAME_KEY_PREFIX.length)
            // Skip non-date suffixes like "boggle_settings"
            if (!DATE_KEY_RE.test(dateKey)) continue
            // Don't overwrite a result that already exists
            if (this.getResult(dateKey)) continue

            // Player game state
            let gameData: { foundWords?: string[]; gameOver?: boolean }
            try {
                gameData = JSON.parse(localStorage.getItem(key) ?? "")
            } catch {
                continue
            }
            if (!gameData.gameOver || !gameData.foundWords?.length) continue

            const scoreRaw = localStorage.getItem(
                `${SCORE_KEY_PREFIX}${dateKey}`
            )
            if (!scoreRaw) continue

            let scoreData: { avasWords?: string[] | null }
            try {
                scoreData = JSON.parse(scoreRaw)
            } catch {
                continue
            }
            if (!scoreData.avasWords?.length) continue

            const { playerScore, avasScore } = this.computeScores(
                gameData.foundWords,
                scoreData.avasWords
            )

            const result: DayResult = {
                playerScore,
                avasScore,
                didWin: playerScore > avasScore,
                fairFight: false, // setting always false
            }

            localStorage.setItem(
                `${RESULT_KEY_PREFIX}${dateKey}`,
                JSON.stringify(result)
            )
        }

        localStorage.setItem(MIGRATION_FLAG, "1")
    }

    /**
     * Scan localStorage for all `result_
     */
    compute = (today: Date) => {
        if (!browser) return

        const todayKey = toISODateKey(today)

        const todayResult = this.getResult(todayKey)
        this.playedToday = todayResult !== null
        this.wonToday = todayResult?.didWin ?? false

        // Collect every result date key present in localStorage
        const playedDates: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith(RESULT_KEY_PREFIX)) {
                playedDates.push(key.slice(RESULT_KEY_PREFIX.length))
            }
        }
        // YYYY-MM-DD -> chronological order
        playedDates.sort()

        this.totalPlayed = playedDates.length
        this.totalWon = playedDates.filter(
            (d) => this.getResult(d)?.didWin === true
        ).length

        const streakAnchor = this.playedToday
            ? todayKey
            : this.shiftDate(todayKey, -1)

        let currentStreak = 0
        let cursor = streakAnchor
        while (this.getResult(cursor) !== null) {
            currentStreak++
            cursor = this.shiftDate(cursor, -1)
        }
        this.currentStreak = currentStreak

        const winAnchor = this.playedToday
            ? todayKey
            : this.shiftDate(todayKey, -1)

        let currentWinStreak = 0
        let winCursor = winAnchor
        while (true) {
            const result = this.getResult(winCursor)
            if (!result || !result.didWin) break
            currentWinStreak++
            winCursor = this.shiftDate(winCursor, -1)
        }
        this.currentWinStreak = currentWinStreak
    }
}

const streakManager = new StreakManager()
export default streakManager
