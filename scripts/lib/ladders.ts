import { isWord, zipfOf } from "./words"

export const substringWords = (w: string, min = 4): string[] => {
    const out = new Set<string>()
    for (let i = 0; i < w.length; i++)
        for (let j = i + min; j <= w.length; j++) {
            const s = w.slice(i, j)
            if (s !== w && isWord(s)) out.add(s)
        }
    return [...out].sort((a, b) => b.length - a.length)
}

const SUFFIXES = new Set([
    "s", "es", "ed", "d", "ing", "er", "ers", "or", "ly", "ness", "ment", "ments", "ion", "tion", "ation", "al", "ally",
    "ful", "less", "ous", "ive", "ity", "ism", "ist", "ish", "able", "ible", "ance", "ence", "ant", "ent", "y", "ry",
    "ery", "ship", "hood", "dom", "ward", "wards", "wise", "like", "ize", "ise", "ized", "ised", "izing", "ising",
    "ate", "ated", "ating", "ic", "ical", "ian", "age", "man", "men", "let", "ling", "est", "ier", "iest", "ies", "ied",
])

const PREFIXES = new Set([
    "un", "re", "in", "im", "dis", "mis", "pre", "over", "under", "out", "non", "sub", "inter", "super", "anti", "de",
    "en", "em", "fore", "counter", "semi", "mid", "co", "ex", "il", "ir", "trans", "up", "off", "on", "by", "auto", "self",
])

const stems = (w: string) =>
    [w, w.endsWith("e") ? w.slice(0, -1) : null, w.endsWith("y") ? w.slice(0, -1) + "i" : null].filter(
        (s): s is string => !!s
    )

export const isPrefixRung = (longer: string, shorter: string): boolean => {
    for (const stem of stems(shorter)) {
        if (!longer.startsWith(stem)) continue
        const rest = longer.slice(stem.length)
        if (SUFFIXES.has(rest)) return true
        if (rest.length >= 2 && rest[0] === stem[stem.length - 1] && SUFFIXES.has(rest.slice(1))) return true
    }
    return false
}

const isSuffixRung = (longer: string, shorter: string) =>
    longer.endsWith(shorter) && PREFIXES.has(longer.slice(0, longer.length - shorter.length))

const derivesFrom = (longer: string, shorter: string) => isPrefixRung(longer, shorter) || isSuffixRung(longer, shorter)

const memo = new Map<string, string[]>()

export const familyLadder = (w: string, min = 4): string[] => {
    const hit = memo.get(w)
    if (hit) return hit
    let chain: string[] = []
    for (const sub of substringWords(w, min)) {
        if (!derivesFrom(w, sub)) continue
        const c = familyLadder(sub, min)
        if (c.length > chain.length) chain = c
    }
    const result = [w, ...chain]
    memo.set(w, result)
    return result
}

export type LadderInfo = {
    rungs: string[]
    depth: number
    topZipf: number
    minRungZipf: number
    allPrefix: boolean
}

export const ladderInfo = (w: string): LadderInfo => {
    const rungs = familyLadder(w)
    const below = rungs.slice(1)
    return {
        rungs,
        depth: rungs.length,
        topZipf: zipfOf(w),
        minRungZipf: below.length ? Math.min(...below.map(zipfOf)) : 0,
        allPrefix: rungs.every((r, i) => i === 0 || isPrefixRung(rungs[i - 1], r)),
    }
}

export const isGoodLadder = (info: LadderInfo) => info.depth >= 3 && info.minRungZipf >= 3.5

export const ladderWeight = (w: string): number => {
    const info = ladderInfo(w)
    if (isGoodLadder(info)) return info.allPrefix ? 6 : 4
    if (info.depth >= 2 && info.minRungZipf >= 4.0) return 2
    return 1
}

export const formatLadder = (rungs: string[], withZipf = false) =>
    rungs.map((r) => (withZipf ? `${r} (${zipfOf(r).toFixed(1)})` : r)).join(" → ")
