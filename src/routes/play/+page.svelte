<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import type { PageData } from "./$types"
    import Game from "@/Game.svelte"
    import { getBoardSettings } from "$lib/boardSettings"
    import { toISODateKey } from "$lib/constants"

    const { data }: { data: PageData } = $props()

    // svelte-ignore state_referenced_locally
    const date = data.date
    const board = getBoardSettings(date)
    const dateKey = toISODateKey(date)

    const dateFormatted = date.toLocaleDateString("en-AU", {
        month: "long",
        day: "2-digit",
        year: "numeric",
    })
</script>

<Head
    title="{dateFormatted} — Beat Me at Boggle"
    />

<Game {board} {dateKey} playerStatus="player" avasWords={data.avasWords} totalWords={data.totalWords} />
