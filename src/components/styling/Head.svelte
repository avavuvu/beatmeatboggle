<script lang="ts">
    import { description as fallBackDescription, title as fallbacktitle } from "$lib/constants"

    const { title, description }: {
        title?: string,
        description?: string
    } = $props()
</script>

<title>{title ?? fallbacktitle}</title>
<meta name="description" content={description ?? fallBackDescription} />
<meta property="og:title" content="{title ?? fallbacktitle} – Play Boggle Free Daily" />
<meta property="og:description" content={description ?? fallBackDescription} />
<meta name="twitter:title" content={title ?? fallbacktitle} />
<meta name="twitter:description" content={description ?? fallBackDescription} />
