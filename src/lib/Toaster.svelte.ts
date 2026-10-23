import type { WordScore } from "./scoring"

export type Toast = {
    content: string[]
    type: "word" | "error"
}

class Toaster {
    toasts = $state<Toast[]>([])
    showToast = $state(false)

    GOOD_WORDS = [
        "Nice",
        "Awesome",
        "Good",
        "Wowza",
        "Yup",
        "Wow",
        "Cool",
        "Sick",
    ]

    addError = (content: string) => {
        this.toasts.push({
            content: [content],
            type: "error",
        })
    }

    addWordToast = ({
        word,
        score,
        opponentName,
    }: {
        word: string
        score: WordScore
        opponentName: string
    }) => {
        const goodWord =
            this.GOOD_WORDS[Math.floor(this.GOOD_WORDS.length * Math.random())]

        const content = [
            `${goodWord}! +${score.points}`,
            ...score.breakdown.map(
                ({ points, reason }) =>
                    `+${points}: ${(() => {
                        switch (reason) {
                            case "unique":
                                return "Unique word bonus"
                            case "opponent bonus":
                                return `'${opponentName} didn't find that' bonus`
                            case "dirty bonus":
                                return "Dirty word bonus"
                            case "hidden word bonus":
                                return "Hidden word bonus"
                            case "rare letter bonus":
                                return "Rare letter bonus"
                            case "length":
                                return `${word.length}-letter word`
                            default:
                                return ""
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
