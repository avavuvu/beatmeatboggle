export const dirtyWords = new Set<string>()

export const initDirtyWords = (text: string) => {
    dirtyWords.clear()

    for (const line of text.split(/\r?\n/)) {
        const word = line.trim()
        if (word) {
            dirtyWords.add(word)
        }
    }
}
