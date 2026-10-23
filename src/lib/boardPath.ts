import { getAdjacentPositions } from "./constants"

export const wordToTiles = (word: string) => [...word.replaceAll("qu", "q")]

export const findPath = ({
    tiles,
    letters,
    size,
}: {
    tiles: string[]
    letters: string[]
    size: number
}): number[] | null => {
    if (tiles.length === 0) return []

    const path: number[] = []
    const everyPosition = [...letters.keys()]

    const extend = (tileIndex: number): boolean => {
        if (tileIndex === tiles.length) return true

        const candidates =
            tileIndex === 0
                ? everyPosition
                : getAdjacentPositions(path[path.length - 1], size)

        for (const position of candidates) {
            if (path.includes(position)) continue
            if (letters[position] !== tiles[tileIndex]) continue

            path.push(position)
            if (extend(tileIndex + 1)) return true
            path.pop()
        }

        return false
    }

    return extend(0) ? path : null
}
