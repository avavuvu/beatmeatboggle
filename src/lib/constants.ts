
export const getAdjacentPositions = (index: number, gridSize: number) => {
    const x = index % gridSize

    const validKeys = [index + gridSize, index - gridSize]

    if (x !== 0) {
        validKeys.push(index - 1)
        validKeys.push(index - gridSize - 1)
        validKeys.push(index + gridSize - 1)
    }
    if (x + 1 < gridSize) {
        validKeys.push(index + 1)
        validKeys.push(index - gridSize + 1)
        validKeys.push(index + gridSize + 1)
    }

    return validKeys.filter((key) => key >= 0 && key < gridSize * gridSize)
}
