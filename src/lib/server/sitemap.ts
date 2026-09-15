import wordList from "../../../static/wordList.txt?raw"
import scrabble from "../../../static/scrabble.txt?raw"

const checkerWords = [...new Set(
    [
        wordList.trim().split("\n"),
        scrabble.trim().split("\n"),
    ].flat()
)]

export const SITEMAP_CHUNK_SIZE = 10_000

export const sitemapChunkCount = Math.ceil(
    checkerWords.length / SITEMAP_CHUNK_SIZE
)

export const getSitemapChunk = (chunk: number): string[] => {
    const start = chunk * SITEMAP_CHUNK_SIZE
    return checkerWords.slice(start, start + SITEMAP_CHUNK_SIZE)
}
