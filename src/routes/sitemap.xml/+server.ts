import { siteUrl } from "$lib/constants"
import { sitemapChunkCount } from "$lib/sitemapConfig"

export const prerender = true

export const GET = () => {
    const sitemaps = [
        `${siteUrl}/sitemap-pages.xml`,
        ...Array.from(
            { length: sitemapChunkCount },
            (_, chunk) => `${siteUrl}/sitemap-words-${chunk}.xml`
        ),
    ]

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((loc) => `    <sitemap><loc>${loc}</loc></sitemap>`).join("\n")}
</sitemapindex>
`

    return new Response(body, {
        headers: { "Content-Type": "application/xml" },
    })
}
