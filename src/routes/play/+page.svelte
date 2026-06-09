<script lang="ts">
    import Head from "@/styling/Head.svelte"
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

<Head
    title="{dateFormatted} — Beat Me at Boggle"
    />

<Game {date} playerStatus="player" avasWords={data.avasWords} totalWords={data.totalWords} />
