<script lang="ts">
    import definitionManaager from "$lib/DefinitionManager.svelte"
    import wordList from "$lib/dictionary/wordList.txt?raw"
    import scrabble from "$lib/dictionary/scrabble.txt?raw"
    import Definition from "@/Definition.svelte"
    import { cross } from "@/icons/cross.svelte"
    import { tick } from "@/icons/tick.svelte"
    import Head from "@/styling/Head.svelte"
    import { fade, slide } from "svelte/transition"
    import Toggle from "@/settings/Toggle.svelte"
    import { preventDefault } from "svelte/legacy"

    const { preloaded }: {
        preloaded?: string
    } = $props()

    const officialList = new Set(wordList.split("\n"))
    const scrabbleList = new Set(scrabble.split("\n"))

    let useScrabble = $state(false)

    // svelte-ignore state_referenced_locally
    let input = $state(preloaded ?? "")

    // svelte-ignore state_referenced_locally
    let testWord = $state(input)

    const outcome = $derived.by(() => {
        const normalizedWord = testWord.toLowerCase().trim()

        if(!normalizedWord) {
            return null
        }

        return {
            word: normalizedWord,
            isWord: (
                useScrabble
                    ? scrabbleList
                    : officialList
                ).has(normalizedWord)
        }
    })

    const define = () => {
        definitionManaager.setWord(testWord)
    }
</script>

<div class="text-foreground min-h-screen flex justify-center items-center gap-4">
    <div class="w-xl px-4 sm:px-2">
        <span class="inline-flex gap-4 w-full">
            <h1 class="px-2 font-bold">Boggle Word Checker</h1>
            <a href="/" class="underline">Return Home</a>
        </span>

        <form
            onsubmit={(event) => {event.preventDefault(); testWord = input}}
            class="border p-4 min-h-48 flex justify-center items-center flex-col gap-4">
            <span>
                Is
                <input
                    class="border p-2 lowercase w-36"
                    type="text"
                    bind:value={input}>
                a word?
            </span>
            <button
                type="submit"
                class="border w-min mx-auto px-2 py-1 hover:bg-foreground hover:text-surface transition-all cursor-pointer">Check</button>
        </form>

        {#if outcome}
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
        {/if}

        <div class="my-4">
            <Toggle
                bind:checked={useScrabble}
                heading="dictionary"
                optionOn="Use Scrabble Dictionary"
                compact/>

            <div class="my-2 text-muted">
                The Boggle board game does not have an official word list. This word-checker is designed for the online word game <a href="/">Beat Me at Boggle.</a> It can also be used for games of pen-and-paper Boggle, as well as Scrabble and other word games. <a href="/about/words">Click here to find out what counts as a word.</a>
            </div>
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
