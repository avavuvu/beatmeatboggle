import { Trie } from "./trie"

class DictionaryManager {
    words: Trie = new Trie()
    list: string[] = []
    loaded = false

    init = (wordListText: string) => {
        this.words = new Trie()
        this.list = wordListText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length >= 3)

        for (const word of this.list) {
            this.words.insert(word)
        }

        this.loaded = true
    }

    tryWord = (word: string) => {
        return this.words.search(word)
    }
}

const dictionaryManager = new DictionaryManager()
export default dictionaryManager
