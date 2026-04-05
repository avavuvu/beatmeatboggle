export class Trie {
    root: TrieNode

    constructor() {
        this.root = new TrieNode("", false)
    }

    insert(word: string) {
        let node = this.root

        for (let i = 0; i < word.length; i++) {
            const character = word[i];
            const alphabetIndex = character.charCodeAt(0) - 97

            let childNode: TrieNode | null = node.children[alphabetIndex]

            if (!childNode) {
                childNode = new TrieNode(character)
                node.children[alphabetIndex] = childNode
            }

            node = childNode
        }

        node.word = word
        node.isEnd = true
    }

    search(word: string): boolean {
        let node = this.root

        for (let i = 0; i < word.length; i++) {
            const character = word[i]
            const alphabetIndex = character.charCodeAt(0) - 97

            let childNode: TrieNode | null = node.children[alphabetIndex]

            if (!childNode) { //node does not have this letter, therefore its not real
                return false
            }

            node = childNode
        }

        return node.isEnd
    }
}

export class TrieNode {
    isEnd: boolean = false
    word: string | null = null
    character: string
    children: (TrieNode | null)[] = Array(26).fill(null)

    constructor(character: string, isEnd: boolean = false) {
        this.character = character
        this.isEnd = isEnd
    }

}

import { wordList } from "./word_list";

class DictionaryManager {
    words: Trie = new Trie()

    init = () => {
        const lines: string[] = wordList.toLowerCase().split(/\r?\n/);

        lines.forEach(line => {
            if (line.length < 3) {
                return
            }

            this.words.insert(line)
        })
    }

    tryWord = (word: string) => {
        return this.words.search(word)
    }
}


const dictionaryManager = new DictionaryManager()
dictionaryManager.init()
export default dictionaryManager

