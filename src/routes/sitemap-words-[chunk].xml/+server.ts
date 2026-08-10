import { error } from "@sveltejs/kit"
import { siteUrl } from "$lib/constants"
import { getSitemapChunk, sitemapChunkCount } from "$lib/sitemapConfig"

export const prerender = true

export const entries = () =>
    Array.from({ length: sitemapChunkCount }, (_, chunk) => ({
        chunk: String(chunk),
    }))

const buildDate = new Date().toISOString()

export const GET = ({ params }: { params: { chunk: string } }) => {
    const chunk = Number(params.chunk)

    if (
        !Number.isInteger(chunk) ||
        chunk < 0 ||
        chunk >= sitemapChunkCount
    ) {
        error(404)
    }

    const words = getSitemapChunk(chunk)

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${words
    .map(
        (word) =>
            `    <url><loc>${siteUrl}/checker/${word}</loc><lastmod>${buildDate}</lastmod></url>`
    )
    .join("\n")}
</urlset>
`

    return new Response(body, {
        headers: { "Content-Type": "application/xml" },
    })
}
