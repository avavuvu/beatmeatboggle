<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import Game from "@/Game.svelte"
    import type { PageData } from "./$types"
    import { dateFromKey } from "$lib/constants"

    const { data }: { data: PageData } = $props()

    const dateFormatted = dateFromKey(data.dateKey).toLocaleDateString("en-AU", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    })
</script>

<Head title={dateFormatted} />

<Game board={data.board} dateKey={data.dateKey} playerStatus="player" opponentWords={data.avasWords} />
