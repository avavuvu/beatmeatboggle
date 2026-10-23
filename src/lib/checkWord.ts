export type WordProblem = "too short" | "already found" | "not in word list"

const MIN_WORD_LENGTH = 3

export const checkWord = ({
    word,
    foundWords,
    totalPossibleWords,
}: {
    word: string
    foundWords: string[]
    totalPossibleWords: string[]
}): WordProblem | null => {
    if (word.length < MIN_WORD_LENGTH) return "too short"
    if (foundWords.includes(word)) return "already found"
    if (!totalPossibleWords.includes(word)) return "not in word list"
    return null
}

export const describeWordProblem = ({
    word,
    problem,
}: {
    word: string
    problem: WordProblem
}) => {
    switch (problem) {
        case "too short":
            return `"${word}" is not long enough`
        case "already found":
            return "Word already found"
        case "not in word list":
            return `"${word}" is not in the word list`
    }
}
