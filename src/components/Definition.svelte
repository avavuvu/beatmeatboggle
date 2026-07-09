<script>
    import definitionManaager from "$lib/DefinitionManager.svelte"
    import { slide } from "svelte/transition"
    import favicon from "$lib/assets/favicon.svg"

    const entry = $derived(definitionManaager.currentDefinition)

</script>
{#if entry}
    <div class="bg-surface border-border w-full h-full">
        {#if entry.type === "definition"}
            <div in:slide class="w-full h-full overflow-y-scroll flex flex-col justify-between ">
                <div class="p-2">
                   	<h2 class="font-bold">{entry.data.word}</h2>
                    <ul class="flex gap-x-2 flex-wrap font-compat">
                        {#each entry.data.ipa as ipa}
                            <li >{ipa}</li>
                        {/each}
                    </ul>
                    <p class="italic">{entry.data.partOfSpeech}</p>
                    <ul class="px-4">
                        {#each entry.data.definitions as definition}
                            <li >
                            <img src={favicon} alt="" class="w-4 mr-2 inline"/>{definition}
                            </li>
                        {/each}
                    </ul>
                </div>
                <div class="w-full  bg-foreground text-surface  px-2 text-right">
                    From <a href={entry.data.wiktionaryLink} class="underline" target="_blank" rel="noopener noreferrer">Wiktionary</a>

                </div>
            </div>
        {:else if entry.type === "error"}
            <div class="p-2 italic text-accent">
                <h2>{entry.error}</h2>
            </div>
        {:else}
            <div class="p-2 w-full h-full flex justify-center items-center">
                <img src="{favicon}" alt="" class="animate-spin w-12 h-12" />
            </div>
        {/if}
    </div>
{/if}
