<script lang="ts">
    import { solve } from "$lib/dictionary/solver"
    import Definition from "@/Definition.svelte"
    import Head from "@/styling/Head.svelte"
    import WordList from "@/WordList.svelte"
    import { fade, slide } from "svelte/transition"

    let size = $state(4)
    const ALPHABET = "abcdefghijklmnoqrstuvwxyz"
    let board = $state(Array.from({length: 49}, (_, i) => ALPHABET[i%25]))

    let solution: string[] | null = $state(null)

    const onsubmit = (event: SubmitEvent) => {
        event.preventDefault()

        solution = [...solve(board.slice(0, size * size), size)].toSorted()
    }
</script>

<Head
    title="Boggle Word Solver"
    description="Find every possible combination of words from your Boggle board, for 4x4, 5x5, 6x6, and 7x7 Boggle boards"
    />


<div class="text-foreground min-h-screen flex justify-center items-center gap-4 py-12">
    <div class="w-xl px-4 sm:px-2">
        <span class="inline-flex gap-4 w-full">
            <h1 class="px-2 font-bold">Boggle Board Solver</h1>
            <a href="/" class="underline">Return Home</a>
        </span>

        <form
            {onsubmit}
            class="border p-4 min-h-48 flex justify-center items-center flex-col gap-4">

            <div class="grid  mx-auto mb-6 text-4xl sm:text-5xl md:text-7xl"
            style:grid-template-rows="repeat({size}, 1fr)"
            style:grid-template-columns="repeat({size}, 1fr)">

            {#each {length: size * size}, i}
                    <div class="tile aspect-square border-surface bg-board focus-within:bg-muted transition-colors">
                        <input
                            class="w-full h-full text-center uppercase text-tile-letter bg-transparent focus:outline-none"
                            type="text"
                            maxlength="1"
                            bind:value={board[i]}
                            onclick={() => board[i] = ""}/>
                    </div>
                {/each}
            </div>

            <div class="flex gap-2">
                <div class="border flex items-center justify-center px-2">
                    <label for="size">Size</label>
                    <input name="size" id="size" class="px-4 outline-0" type="number" bind:value={size} min="2" max="7"/>
                </div>
                <button class="border w-min mx-auto px-2 py-1 hover:bg-foreground hover:text-surface transition-all cursor-pointer">Solve</button>


            </div>
        </form>

        {#if solution}
            <div class="border p-4 min-h-36 gap-4 my-4 text-left grid grid-cols-1 grid-rows-1 mb-24" transition:slide>
                <div in:fade class="col-start-1 col-end-2 row-start-1 row-end-2">
                    <p class="italic text-accent mb-2">Click on a word to see its definition</p>
                    <WordList words={solution} />
                </div>

                <div class="definition col-start-1 col-end-2 row-start-1 row-end-2 text-left">
                    <Definition/>
                </div>
            </div>
        {/if}

        <div class="my-4 text-muted">

        </div>

    </div>
</div>

<style>

    a {
        text-decoration: underline;
    }

    .tile {
        border-width: 1px;
    }

     .definition:empty {
         pointer-events: none;
     }
</style>
