import { solve } from "../dictionary/solver"
import { generateClassic, generateClusters, generateClaude } from "../generateBoard"

const N = 200

const generators = {
    classic: () => solve(generateClassic()).size,
    clusters: () => solve(generateClusters()).size,
    claude: () => solve(generateClaude()).size,
    clusters_40v: () => solve(generateClusters(0.4)).size,
    clusters_60v: () => solve(generateClusters(0.6)).size,
}

const keys = Object.keys(generators) as (keyof typeof generators)[]

const header = ["run", ...keys].join(",")

const lines = [header]

for (let i = 1; i <= N; i++) {
    const values = keys.map(k => generators[k]())
    lines.push([i, ...values].join(","))
}

// @ts-expect-error
process.stdout.write(lines.join("\n") + "\n")