import { readFile } from "node:fs/promises"
import { join } from "node:path"
import dictionaryManager from "../dictionary/DictionaryManager"
import { dirtyWords, initDirtyWords } from "../dictionary/dirtyWords"

// on netlify the file is shipped via included_files and process.cwd() is the function bundle root
export const loadDictionaryFromDisk = async (): Promise<void> => {
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
