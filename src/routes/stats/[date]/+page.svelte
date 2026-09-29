<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import TextBlock from "@/styling/TextBlock.svelte"
    import Stats from "@/stats/Stats.svelte"
    import type { PageData } from "./$types"
    import { formatDateKey } from "$lib/dates"

    const { data }: { data: PageData } = $props()

    const dateFormatted = $derived(formatDateKey(data.dateKey))
</script>

<Head title={`Stats for ${dateFormatted}`} />

<TextBlock title={`Stats for ${dateFormatted}`}>
    <Stats {data} />
</TextBlock>
