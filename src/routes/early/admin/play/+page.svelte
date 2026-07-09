<script lang="ts">
    import Game from "@/Game.svelte"
    const { data }: { data: { dateStr: string } } = $props()
    const date = new Date(data.dateStr + 'T00:00:00')
</script>

<Game playerStatus="ava" {date} avasWords={null} totalWords={null} />
