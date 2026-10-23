export const RARE_SHARE = 0.1
export const RARE_MISSED_SHARE = 0.045

export const shareOf = ({
    word,
    shares,
}: {
    word: string
    shares: Record<string, number> | null
}) => (shares ? (shares[word] ?? 0) : null)

export const isRare = ({
    word,
    shares,
    threshold = RARE_SHARE,
}: {
    word: string
    shares: Record<string, number> | null
    threshold?: number
}) => {
    const share = shareOf({ word, shares })
    return share !== null && share < threshold
}
