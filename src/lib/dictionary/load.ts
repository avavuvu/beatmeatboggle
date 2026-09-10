import dictionaryManager from "./DictionaryManager"
import { dirtyWords, initDirtyWords } from "./dirtyWords"

export const loadDictionary = async (fetchFn: typeof fetch = fetch): Promise<void> => {
    if (dictionaryManager.loaded) {
        return
    }

    const response = await fetchFn("/wordList.txt")
    dictionaryManager.init(await response.text())
}

export const loadDirtyWords = async (fetchFn: typeof fetch = fetch): Promise<void> => {
    if (dirtyWords.size > 0) {
        return
    }

    const response = await fetchFn("/dirtyWords.txt")
    initDirtyWords(await response.text())
}
