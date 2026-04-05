export const GRID_SIZE = 4

export const getAdjacentPositions = (index: number) => {
    const x = index % GRID_SIZE

    const validKeys = [index + GRID_SIZE, index - GRID_SIZE]

    if (x !== 0) {
        validKeys.push(index - 1)
        validKeys.push(index - GRID_SIZE - 1)
        validKeys.push(index + GRID_SIZE - 1)
    }
    if (x + 1 < GRID_SIZE) {
        validKeys.push(index + 1)
        validKeys.push(index - GRID_SIZE + 1)
        validKeys.push(index + GRID_SIZE + 1)
    }

    return validKeys.filter((key) => key >= 0 && key < GRID_SIZE * GRID_SIZE)
}
