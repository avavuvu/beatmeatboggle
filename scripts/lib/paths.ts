import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

export const SCRIPTS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..")
export const ROOT_DIR = resolve(SCRIPTS_DIR, "..")
export const DATA_DIR = resolve(SCRIPTS_DIR, "data")
export const DOCS_DIR = resolve(ROOT_DIR, "docs")
export const GRAPHS_DIR = resolve(DOCS_DIR, "graphs")

export const dataPath = (name: string) => {
    mkdirSync(DATA_DIR, { recursive: true })
    return resolve(DATA_DIR, name)
}
