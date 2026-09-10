<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import type { PageData } from "./$types"
    import Game from "@/Game.svelte"
    import { dateFromKey } from "$lib/constants"

    const { data }: { data: PageData } = $props()

    const date = dateFromKey(data.dateKey)

    const dateFormatted = date.toLocaleDateString("en-AU", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    })
</script>

<Head
    title="{dateFormatted} — Beat Me at Boggle"
    />

<Game dateKey={data.dateKey} board={data.board} playerStatus="player" opponentWords={data.avasWords} />
