import type { ScoreItem } from "./ScoreTracker.svelte"

export type Toast = {
    content: string[]
    type: "word" | "error"
}

class Toaster {
    toasts = $state<Toast[]>([])
    showToast = $state(false)

    GOOD_WORDS = [
        "Nice", "Awesome", "Good", "Wowza", "Yup", "Wow", "Cool", "Sick",
    ]

    addError = (content: string) => {
        this.toasts.push({
            content: [content],
            type: "error",
        })
    }

    addWordToast = (
        word: string,
        scoreItem: ScoreItem[],
        totalPoints: number,
        opponentName: string
    ) => {
        const goodWord =
            this.GOOD_WORDS[Math.floor(this.GOOD_WORDS.length * Math.random())]

        const content = [
            `${goodWord}! +${totalPoints}`,
            ...scoreItem.map(
                ({ points, reason }) =>
                    `+${points}: ${(() => {
                        switch (reason) {
                            case "unique":          return "Unique word bonus"
                            case "opponent bonus":  return `'${opponentName} didn't find that' bonus`
                            case "dirty bonus":     return "Dirty word bonus"
                            case "length":          return `${word.length} letter word`
                            default:                return ""
                        }
                    })()}`
            ),
        ]

        this.toasts.push({
            content,
            type: "word",
        })
    }
}

const toaster = new Toaster()
export default toaster
