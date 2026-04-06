import type { ScoreItem } from "./ScoreManager.svelte"

export type Toast = {
    content: string[],
    type: "word" | "error"
}

class ToastManager {
    toasts = $state<Toast[]>([])

    GOOD_WORDS = [
        "Nice", "Awesome", "Good",
        "Wowza", "Yup", "Wow", "Cool"
    ]


    addError = (content: string) => {
        this.toasts.push({
            content: [content],
            type: "error"
        })
    }

    addWordToast = (word: string, scoreItem: ScoreItem[], totalPoints: number) => {
        const goodWord = this.GOOD_WORDS[Math.floor(this.GOOD_WORDS.length * Math.random())]

        const content = [
            `${goodWord}! +${totalPoints}`,
            ...scoreItem.map(({ points, reason }) =>
                `+${points}: ${(() => {
                    switch (reason) {
                        case "ava bonus":
                            return "'Ava didn't find that' bonus"
                        case "dirty bonus":
                            return "Dirty word bonus"
                        case "length":
                            return `${word.length} letter word`
                        default:
                            return ""
                    }
                })()}`
            )
        ]

        this.toasts.push({
            content,
            type: "word"
        })
    }


}

const toastManager = new ToastManager()
export default toastManager