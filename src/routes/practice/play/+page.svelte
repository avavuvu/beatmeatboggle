<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import Game from "@/Game.svelte"
    import type { PageData } from "./$types"

    const { data }: { data: PageData } = $props()
</script>

<Head title="Practice — Beat Me At Boggle" />

<Game board={data.board} dateKey={data.practiceKey} playerStatus="practice" avasWords={null} totalWords={null} />
