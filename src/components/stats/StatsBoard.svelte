<script lang="ts">
    import Tile from "@/Tile.svelte"

    const { size, letters }: { size: number; letters: string[] } = $props()

    const cells = $derived(
        letters.map((letter, index) => ({
            x: index % size,
            y: Math.floor(index / size),
            char: letter.toUpperCase(),
        }))
    )
</script>

<svg class="grid" viewBox="0 0 {size} {size}" role="img" aria-label="{size}x{size} board">
    {#each cells as { x, y, char }}
        <g transform={`translate(${x}, ${y})`}>
            <Tile {char} selected={false} />
        </g>
    {/each}
</svg>

<style>
    .grid {
        width: min(100%, 500px);
        margin: 0 auto;
    }

    svg {
        width: 100%;
        user-select: none;
    }
</style>
