<script lang="ts">
    import definitionManaager from "$lib/DefinitionManager.svelte"
    import Definition from "@/Definition.svelte"
    import { cross } from "@/icons/cross.svelte"
    import { tick } from "@/icons/tick.svelte"
    import Head from "@/styling/Head.svelte"
    import { fade, slide } from "svelte/transition"



    const onsubmit = (event: SubmitEvent) => {


    }

</script>

<Head
    title="Boggle Word Solver"
    description="Find every possible combination of words from your Boggle board"
    />


<div class="text-foreground min-h-screen flex justify-center items-center gap-4">
    <div class="w-xl px-4 sm:px-2">
        <span class="inline-flex gap-4 w-full">
            <h1 class="px-2 font-bold">Boggle Board Solver</h1>
            <a href="/" class="underline">Return Home</a>
        </span>

        <form
            {onsubmit}
            class="border p-4 min-h-48 flex justify-center items-center flex-col gap-4">

            <button class="border w-min mx-auto px-2 py-1 hover:bg-foreground hover:text-surface transition-all cursor-pointer">Check</button>
        </form>

        <!-- {#if outcome}
            <div class="border p-4 min-h-36 gap-4 my-4 text-center grid grid-cols-1 grid-rows-1" transition:slide>
                {#key outcome.word}
                    <div in:fade class="flex gap-2 flex-col justify-center items-center
                        col-start-1 col-end-2 row-start-1 row-end-2">

                        <div class="w-12">
                            {#if outcome.isWord}
                                {@render tick()}
                            {:else}
                                {@render cross()}
                            {/if}

                        </div>
                        <span>
                            {outcome.word}

                            {#if outcome.isWord}
                                <span> is a word</span>
                            {:else}
                                <span> is NOT a word</span>
                            {/if}
                        </span>

                        <button
                            onclick={define}
                            class="border  mx-auto px-2 py-1 hover:bg-foreground hover:text-surface transition-all cursor-pointer">
                            Define {outcome.word}
                        </button>
                    </div>
                {/key}

                <div class="definition col-start-1 col-end-2 row-start-1 row-end-2 text-left">
                    <Definition/>
                </div>
            </div>
        {/if} -->

        <div class="my-4 text-muted">
        </div>

    </div>
</div>

<style>

    a {
        text-decoration: underline;
    }

     .definition:empty {
         pointer-events: none;
     }
</style>
