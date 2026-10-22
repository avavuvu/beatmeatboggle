import { readFileSync, writeFileSync } from "node:fs"

export type Cell = string | number | boolean | null | undefined
export type Row = Record<string, Cell>

const encode = (v: Cell): string => {
    if (v === null || v === undefined) return ""
    if (typeof v === "string") return `"${v.replaceAll('"', '""')}"`
    return String(v)
}

export const writeCsv = (path: string, rows: Row[]) => {
    if (!rows.length) throw new Error(`no rows to write to ${path}`)
    const header = Object.keys(rows[0])
    const lines = rows.map((r) => header.map((h) => encode(r[h])).join(","))
    writeFileSync(path, [header.join(","), ...lines].join("\n") + "\n")
}

const decode = (raw: string, quoted: boolean): Cell => {
    if (quoted) return raw
    if (raw === "") return null
    if (raw === "true") return true
    if (raw === "false") return false
    return Number(raw)
}

const parseLine = (line: string): Cell[] => {
    const out: Cell[] = []
    let i = 0
    while (i <= line.length) {
        if (line[i] === '"') {
            let s = ""
            i++
            while (i < line.length) {
                if (line[i] === '"') {
                    if (line[i + 1] === '"') {
                        s += '"'
                        i += 2
                        continue
                    }
                    i++
                    break
                }
                s += line[i++]
            }
            out.push(decode(s, true))
            i++
        } else {
            const end = line.indexOf(",", i)
            const raw = end === -1 ? line.slice(i) : line.slice(i, end)
            out.push(decode(raw, false))
            i = end === -1 ? line.length + 1 : end + 1
        }
    }
    return out
}

export const readCsv = <T extends Row = Row>(path: string): T[] => {
    const lines = readFileSync(path, "utf8").trim().split("\n")
    const header = lines[0].split(",")
    return lines.slice(1).map((l) => {
        const values = parseLine(l)
        return Object.fromEntries(header.map((k, i) => [k, values[i]])) as T
    })
}
