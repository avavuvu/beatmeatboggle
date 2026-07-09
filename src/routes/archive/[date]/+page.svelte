<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import Game from "@/Game.svelte"

    const { data }: { data: { date: Date; avasWords: string[]; totalWords: string[] | null } } = $props()

    const dateFormatted = data.date.toLocaleDateString('en-AU', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
    })
</script>

<Head title="{dateFormatted} — Beat Me At Boggle" />

<Game date={data.date} playerStatus="player" avasWords={data.avasWords} totalWords={data.totalWords} />
