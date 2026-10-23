import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import dictionaryManager from "../../src/lib/dictionary/DictionaryManager"
import { loadDictionaryFromDisk } from "../../src/lib/server/dictionary"
import { SCRIPTS_DIR } from "./paths"

let wordSet = new Set<string>()
export const zipf = new Map<string, number>()

export const FORBIDDEN_DOUBLE = /(aa|uu|ii|qq|ww|yy|hh|kk|xx|cc|vv)/

export type LoadOptions = {
    ref?: string
}

export const loadWords = async ({ ref }: LoadOptions = {}) => {
    if (ref) {
        dictionaryManager.init(execSync(`git show ${ref}:static/wordList.txt`, { encoding: "utf8" }))
    } else {
        await loadDictionaryFromDisk()
    }
    wordSet = new Set(dictionaryManager.list)

    zipf.clear()
    for (const line of readFileSync(`${SCRIPTS_DIR}/wordlist/wordfreq_en.tsv`, "utf8").split("\n")) {
        const [w, z] = line.split("\t")
        if (w) zipf.set(w, Number(z))
    }
}

export const allWords = () => dictionaryManager.list
export const isWord = (w: string) => wordSet.has(w)
export const zipfOf = (w: string) => zipf.get(w) ?? 0

export const isPluralOnly = (w: string) =>
    (w.endsWith("s") && wordSet.has(w.slice(0, -1))) ||
    (w.endsWith("es") && wordSet.has(w.slice(0, -2))) ||
    (w.endsWith("ies") && wordSet.has(w.slice(0, -3) + "y"))

export type Inflection = "ing" | "ed" | "ness" | "ly" | "est" | "ers" | "er" | "plural" | "base"

export const inflectionOf = (w: string): Inflection => {
    if (w.endsWith("ing")) return "ing"
    if (w.endsWith("ed")) return "ed"
    if (w.endsWith("ness")) return "ness"
    if (w.endsWith("ly")) return "ly"
    if (w.endsWith("est")) return "est"
    if (w.endsWith("ers")) return "ers"
    if (w.endsWith("er")) return "er"
    if (isPluralOnly(w)) return "plural"
    return "base"
}

export const rareLetters = (w: string) => [...w].filter((c) => "jqxz".includes(c)).length

export const isPlaceable = (w: string) => !FORBIDDEN_DOUBLE.test(w.replace("qu", "q"))
