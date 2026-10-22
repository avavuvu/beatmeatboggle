import { readFile } from "node:fs/promises"
import { join } from "node:path"
import dictionaryManager from "../dictionary/DictionaryManager"
import { dirtyWords, initDirtyWords } from "../dictionary/dirtyWords"
import { loadSeedPoolFromDisk } from "./generation/pool"

export const loadDictionaryFromDisk = async (): Promise<void> => {
    await loadSeedPoolFromDisk()

    if (dictionaryManager.loaded) {
        return
    }

    dictionaryManager.init(await readFile(join(process.cwd(), "static", "wordList.txt"), "utf8"))
}

export const loadDirtyWordsFromDisk = async (): Promise<void> => {
    if (dirtyWords.size > 0) {
        return
    }

    initDirtyWords(await readFile(join(process.cwd(), "static", "dirtyWords.txt"), "utf8"))
}
