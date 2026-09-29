<script lang="ts">
    import type { WordStat } from "$lib/statsTypes"

    const { words, previewCount = 3 }: { words: WordStat[]; previewCount?: number } = $props()

    let showAll = $state(false)

    const wordTable = $derived(showAll ? words : words.slice(0, previewCount))
</script>

<h2 class="font-bold">Most common words</h2>

<table class="w-full">
    <thead>
        <tr>
            <th>Word</th>
            <th>Play %</th>
        </tr>
    </thead>
    <tbody>
        {#each wordTable as { word, plays, percentage } (word)}
            <tr>
                <td class="uppercase">{word}</td>
                <td>
                    {#if percentage <= 1}
                        {plays}
                        {#if plays === 1}
                            very clever person
                        {:else}
                            people
                        {/if}
                    {:else}
                        {percentage.toFixed(2)}%
                    {/if}
                </td>
            </tr>
        {/each}
        {#if !showAll}
            <tr>
                <td colspan="2">
                    <button onclick={() => showAll = true}>show all</button>
                </td>
            </tr>
        {/if}
    </tbody>
</table>

<style>
    button {
        width: 100%;
        font-weight: bold;
        text-decoration: underline;
        cursor: pointer;
    }
</style>
