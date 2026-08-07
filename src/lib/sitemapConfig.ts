import { checkerWords } from "./dictionary/checkerWords"

export const SITEMAP_CHUNK_SIZE = 10_000

export const sitemapChunkCount = Math.ceil(
    checkerWords.length / SITEMAP_CHUNK_SIZE
)

export const getSitemapChunk = (chunk: number): string[] => {
    const start = chunk * SITEMAP_CHUNK_SIZE
    return checkerWords.slice(start, start + SITEMAP_CHUNK_SIZE)
}
