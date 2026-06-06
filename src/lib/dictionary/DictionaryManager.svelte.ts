import { Trie } from "./trie"
import wordList from "./wordList.txt?raw"

class DictionaryManager {
    words: Trie = new Trie()

    init = () => {
        const lines: string[] = wordList.split(/\r?\n/)

        for (const line of lines) {
            if (line.length < 3) {
                return
            }

            this.words.insert(line)
        }
    }

    tryWord = (word: string) => {
        return this.words.search(word)
    }
}

const dictionaryManager = new DictionaryManager()
dictionaryManager.init()
export default dictionaryManager
