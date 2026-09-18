<script lang="ts">
    const { members }: { members: Record<number, string[]> } = $props()

    const tiers = $derived(
        Object.entries(members)
            .map(([cents, names]) => [Number(cents), names] as const)
            .toSorted(([a], [b]) => b - a)
    )
</script>

{#if tiers.length > 0}
    <br />
    <h2 class="font-bold">Beat Me at Boggle is brought to you by:</h2>
    <p >
        I do not run ads on Beat Me at Boggle.
        <a href="https://www.patreon.com/2722716/join" target="_blank" rel="noopener">Please consider supporting me if you like my work</a>.
    </p>
    {#each tiers as [cents, names]}
        {#if cents > 300}
            {#if cents > 999}
            <h3 class="font-bold text-center">Extra special people</h3>
            {/if}
            <ul class="flex flex-wrap gap-x-[4ch] gap-y-1 justify-center list-disc">
                {#each names as name}
                    <li>{name}</li>
                {/each}
            </ul>
        {/if}
    {/each}
{/if}
