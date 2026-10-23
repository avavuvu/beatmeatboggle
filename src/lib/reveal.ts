import type { GameSession } from "./gameSession"
import { scoreOpponent, scorePlayer } from "./scoring"

export const reveal = ({
    session,
    foundWords,
}: {
    session: GameSession
    foundWords: string[]
}) => {
    const { match, opponentName, totalPossibleWords } = session
    const hasOpponent = match.opponentWords !== null
    const opponentWords = match.opponentWords ?? []
    const foundByYou = new Set(foundWords)
    const foundByOpponent = new Set(opponentWords)

    const you = scorePlayer({ words: foundWords, match })
    const opponent = scoreOpponent({ playerWords: foundWords, match })

    return {
        opponentName,
        scores: { you, opponent },
        didWin: hasOpponent ? you > opponent : null,
        opponentWords: opponentWords.toSorted(),
        playerWords: foundWords.toSorted(),
        missedWords: totalPossibleWords
            .filter(
                (word) => !foundByYou.has(word) && !foundByOpponent.has(word)
            )
            .toSorted(),
        foundByYou,
        uniqueToYou: new Set(
            hasOpponent
                ? foundWords.filter((word) => !foundByOpponent.has(word))
                : []
        ),
    }
}
