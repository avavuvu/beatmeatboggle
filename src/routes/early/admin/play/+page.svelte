<script lang="ts">
    import Game from "@/Game.svelte";
    import { getBoardSettings } from "$lib/boardSettings"
    import { toISODateKey } from "$lib/constants"

    const { data }: { data: { dateStr: string } } = $props()
    // svelte-ignore state_referenced_locally
    const date = new Date(data.dateStr + 'T00:00:00')
    const board = getBoardSettings(date)
    const dateKey = toISODateKey(date)
</script>

<Game playerStatus="ava" {board} {dateKey} avasWords={null} totalWords={null} />
