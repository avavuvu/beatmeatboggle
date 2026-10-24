<script lang="ts">
    import WordButton from "./WordButton.svelte"

    export type WordMarks = {
        found?: boolean
        unique?: boolean
        rare?: boolean
    }

    const {
        words,
        selectedWord,
        onWordClick,
        marks,
        rareLabel = true,
    }: {
        words: string[]
        selectedWord: string | null
        onWordClick: (word: string) => void
        marks?: (word: string) => WordMarks
        rareLabel?: boolean
    } = $props()
</script>

<ul class="flex flex-wrap gap-x-2 gap-y-3 h-min">
    {#each words as word}
        {@const isSelected = selectedWord === word}
        {@const wordMarks = marks?.(word)}
        {@const label =
            wordMarks?.rare && rareLabel
                ? "rare!"
                : wordMarks?.unique
                  ? "unique!"
                  : null}

        <li class:found={wordMarks?.found} class:rare={wordMarks?.rare}>
            <WordButton
                {word}
                selected={isSelected}
                onclick={() => onWordClick(word)}
            />
            {#if label && !isSelected}
                <span class="label">{label}</span>
            {/if}
        </li>
    {/each}
</ul>

<style>
    li {
        position: relative;
        display: flex;
        interpolate-size: allow-keywords;
        width: max-content;
        transition: all 200ms ease;
    }

    .found {
        background-color: var(--color-muted);
        color: var(--color-surface);
    }

    .rare {
        text-decoration: underline;
        text-underline-offset: 3px;
    }

    .label {
        position: absolute;
        font-size: xx-small;
        left: 50%;
        transform: translateX(-50%);
        bottom: -6px;
        white-space: nowrap;
        pointer-events: none;
        color: var(--color-foreground);
    }
</style>
