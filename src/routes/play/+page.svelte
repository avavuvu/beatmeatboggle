<script lang="ts">
    import type { PageData } from "./$types"
    import Game from "@/Game.svelte"

    const { data }: { data: PageData } = $props()

    const date = data.date

    const dateFormatted = date.toLocaleDateString("en-AU", {
        month: "long",
        day: "2-digit",
        year: "numeric",
    })
</script>

<svelte:head>
    <title>{dateFormatted} — Beat Me at Boggle</title>
</svelte:head>

<Game {date} playerStatus="player" avasWords={data.avasWords} totalWords={data.totalWords} />
