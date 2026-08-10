<script lang="ts">
    import definitionManaager from "$lib/DefinitionManager.svelte"

    const {
        words,
        itemClass,
    }: {
        words: string[]
        itemClass?: (word: string) => string | undefined
    } = $props()

    let selectedWord = $state("")

    const handleWordClick = async (word: string) => {
        if (selectedWord === word) {
            await definitionManaager.setWord(word)
            return
        }

        selectedWord = word
    }
</script>

<ul class="flex flex-wrap gap-2 h-min">
    {#each words as word}
        {@const isSelected = selectedWord === word}
        <li class={itemClass?.(word)}>
            <button
                class="flex overflow-hidden cursor-pointer"
                class:selected-word={isSelected}
                onclick={() => handleWordClick(word)}>
                <span class="whitespace-nowrap overflow-hidden max-w-0 transition-all duration-200"
                    class:max-w-0={!isSelected}
                    style={isSelected ? `max-width: calc(${word.length}ch + 6rem)` : ''}>
                    define "
                </span>
                <span>{word}</span>
                <span class:max-w-0={!isSelected}>"</span>
            </button>
        </li>
    {/each}
</ul>

<style>
    li {
        interpolate-size: allow-keywords;
        width: max-content;
        transition: all 200ms ease;
    }

    li:has(.selected-word) {
        width: max-content;
        text-decoration: underline;
        background-color: var(--color-foreground);
        color: var(--color-surface);
    }

    :global(.found) {
	    background-color: var(--color-muted);
	    color: var(--color-surface);
    }

    :global(.found::after) {
    	content: "you found!";
    	position: absolute;
    	font-size: xx-small;
    	left: 50%;
    	transform: translateX(-50%);
    	bottom: -6px;
    }

    :global(.unique) {
    	position: relative;
    }

    :global(.unique:has(.selected-word)::after) {
        display: none;
    }

    :global(.unique::after) {
    	content: "unique!";
    	position: absolute;
    	font-size: xx-small;
    	left: 50%;
    	transform: translateX(-50%);
    	bottom: -6px;
    }
</style>
