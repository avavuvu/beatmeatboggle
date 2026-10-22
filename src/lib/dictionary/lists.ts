import wordList from "../../../static/wordList.txt?raw"
import scrabble from "../../../static/scrabble.txt?raw"

export const officialWords = new Set(wordList.trim().split("\n"))
export const scrabbleWords = new Set(scrabble.trim().split("\n"))
export const checkerWords = new Set([...officialWords, ...scrabbleWords])
