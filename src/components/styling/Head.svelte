<script lang="ts">
    import { description as fallbackDescription, title as siteTitle } from "$lib/constants"

    const { title, description }: {
        title?: string,
        description?: string
    } = $props()

    const fullTitle = $derived(title ? `${title} – ${siteTitle}` : siteTitle)
    const ogTitle = $derived(title ? fullTitle : `${siteTitle} – Play Boggle Free Daily`)
    const metaDescription = $derived(description ?? fallbackDescription)
</script>

<svelte:head>
    <title>{fullTitle}</title>
    <meta name="description" content={metaDescription} />
    <meta property="og:title" content={ogTitle} />
    <meta property="og:description" content={metaDescription} />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={metaDescription} />
</svelte:head>
