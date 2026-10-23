export const VOWEL_POOL = "eeeeeeeeeeeaaaaaaiiiiiiooooooouuu".split("")
export const CONSONANT_POOL =
    "llllnnnnnnsssssstttttttttdddrrrrrbbccgghhhhhmmppyyyffkvvwwwjqxz".split("")

export const VOWEL_TARGETS: Record<number, number[]> = {
    4: [5, 6, 6, 7],
    5: [8, 9, 9, 10],
}

export const VOWEL_WEIGHTS: Record<string, number> = {
    e: 5,
    a: 4,
    i: 3,
    o: 3,
    u: 1,
}

export const CONSONANT_WEIGHTS: Record<string, number> = {
    t: 6,
    n: 6,
    r: 5,
    s: 4,
    l: 4,
    d: 4,
    h: 3,
    c: 3,
    m: 3,
    p: 3,
    g: 2,
    b: 2,
    y: 2,
    f: 2,
    k: 1,
    w: 1,
    v: 1,
    j: 0.4,
    q: 0.4,
    x: 0.5,
    z: 0.5,
}

export const VOWEL_CAPS: Record<string, number> = {
    e: 3,
    a: 2,
    i: 2,
    o: 2,
    u: 1,
}
export const CONSONANT_CAP = 2

export const isVowel = (letter: string) =>
    letter !== "" && "aeiou".includes(letter)

export const FORBIDDEN_DOUBLE = /(aa|uu|ii|qq|ww|yy|hh|kk|xx|cc|vv)/

export const isPlaceable = (word: string) =>
    !FORBIDDEN_DOUBLE.test(word.replace("qu", "q"))
