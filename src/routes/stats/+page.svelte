<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import TextBlock from "@/styling/TextBlock.svelte"
    import Stats from "@/stats/Stats.svelte"
    import type { PageData } from "./$types"
    import { page } from "$app/state"

    const { data }: { data: PageData } = $props()

    const kickback = $derived(page.url.searchParams.get("kickback") !== null)
</script>

<Head title="Yesterday's Stats" />

<TextBlock title="Yesterday's Stats">
    {#if kickback}
        <p>Only subscribers can access past stats.</p>
    {/if}

    <Stats {data} />
</TextBlock>
