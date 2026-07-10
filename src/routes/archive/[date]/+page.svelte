<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import Game from "@/Game.svelte"
    import { getBoardSettings } from "$lib/boardSettings"
    import { toISODateKey } from "$lib/constants"

    const { data }: { data: { date: Date; avasWords: string[]; totalWords: string[] | null } } = $props()
    // svelte-ignore state_referenced_locally
    const board = getBoardSettings(data.date)
    const dateKey = toISODateKey(data.date)

    const dateFormatted = data.date.toLocaleDateString('en-AU', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
    })
</script>

<Head title="{dateFormatted} — Beat Me At Boggle" />

<Game {board} {dateKey} playerStatus="player" avasWords={data.avasWords} totalWords={data.totalWords} />
