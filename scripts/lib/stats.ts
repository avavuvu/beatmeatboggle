export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export const median = (xs: number[]) => quantile(xs, 0.5)

export const quantile = (xs: number[], p: number) => {
    if (!xs.length) return 0
    const s = [...xs].sort((a, b) => a - b)
    return s[Math.floor(p * (s.length - 1))]
}

export const pearson = (xs: number[], ys: number[]) => {
    const mx = mean(xs)
    const my = mean(ys)
    let num = 0
    let dx = 0
    let dy = 0
    for (let i = 0; i < xs.length; i++) {
        num += (xs[i] - mx) * (ys[i] - my)
        dx += (xs[i] - mx) ** 2
        dy += (ys[i] - my) ** 2
    }
    return dx && dy ? num / Math.sqrt(dx * dy) : 0
}

const rank = (a: number[]) => {
    const sorted = a.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0])
    const r = new Array<number>(a.length)
    sorted.forEach(([, i], k) => (r[i] = k))
    return r
}

export const spearman = (xs: number[], ys: number[]) => pearson(rank(xs), rank(ys))

export const bootstrapCI = (xs: number[], iterations = 1000): [number, number] => {
    let s = 1234567
    const rng = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
    const means: number[] = []
    for (let b = 0; b < iterations; b++) {
        let sum = 0
        for (let i = 0; i < xs.length; i++) sum += xs[Math.floor(rng() * xs.length)]
        means.push(sum / xs.length)
    }
    means.sort((a, b) => a - b)
    return [means[Math.floor(iterations * 0.025)], means[Math.floor(iterations * 0.975)]]
}

export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`
export const round = (x: number, digits = 1) => Number(x.toFixed(digits))
export const share = (xs: boolean[]) => mean(xs.map((x) => (x ? 1 : 0)))
