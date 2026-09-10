import { readFile } from "node:fs/promises"
import { join } from "node:path"
import dictionaryManager from "../dictionary/DictionaryManager"

// on netlify the file is shipped via included_files and process.cwd() is the function bundle root
export const loadDictionaryFromDisk = async (): Promise<void> => {
    if (dictionaryManager.loaded) {
        return
    }

    dictionaryManager.init(await readFile(join(process.cwd(), "static", "wordList.txt"), "utf8"))
}
