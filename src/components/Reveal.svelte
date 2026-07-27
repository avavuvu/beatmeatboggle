<script lang="ts">
    import scoreTracker from "$lib/ScoreTracker.svelte";
    import JSConfetti from "js-confetti";
    import { page } from "$app/state";
    import { fade, slide } from "svelte/transition";
    import preferences from "$lib/Preferences.svelte"
    import definitionManaager from "$lib/DefinitionManager.svelte"
    import type GameManager from "$lib/GameManager.svelte"
    import favicon from "$lib/assets/favicon.svg"
    import { encodeChallenge } from "$lib/challenge/challengeToken"
    import { challengeManager } from "$lib/challenge/challenge.svelte"

    const { game }: {
        game: GameManager
    }  = $props()

    // svelte-ignore state_referenced_locally
    const {
        scores,
        totalWordSet,
        didWin,
        opponentWordMap,
        playerWordMap,
        totalWordsMap,
        opponentName
    } = scoreTracker.getReveal(game.foundWords, game.session.totalPossibleWords)

    const delay = 1000;

    let mounted = $state(false);

    $effect(() => {
        setTimeout(() => {
            mounted = true;
        }, 1000);

        if (didWin) {
            const confetti = new JSConfetti();

            confetti.addConfetti({
                confettiRadius: 6,
            });
        }
    });

    const getDelayStyle = (index: number) => `transition-delay: ${delay + index * 400}ms;`

    let selectedWord = $state("")
    const handleDictionaryWordClick = async (word: string, section: "opponent" | "player" | "total") => {
        const id = `${word}-${section}`

        if(selectedWord === id) {
            // fetch definition
            await definitionManaager.setWord(word)
            return
        }

        selectedWord = id
    }
</script>

{#snippet chartBar(index: number, score: number, name: string )}
<div
    in:fade
    class="flex flex-col w-full justify-end text-sm text-center relative"
>
    <div
        class="text-center w-full text-surface absolute transition-all duration-500"
        class:move={score < 40}
        style="opacity: {Number(mounted) * 100}%; {getDelayStyle(index)}"
    >
        <p>{name}</p>
        <p>
            {Math.floor(score)}
        </p>
    </div>
    <div
        class:player={name === "You!"}
        class="bar text-xs text-surface transition-all duration-500 ease-out"
        style="height: {mounted
            ? (Number(score) / totalWordSet.size) * 100
            : 0}%; {getDelayStyle(index)}"
    ></div>
</div>
{/snippet}

{#snippet dictionaryWord(word: string, section: "opponent" | "player" | "total")}
    {@const isSelected = selectedWord === `${word}-${section}`}
	<button
        class="flex overflow-hidden cursor-pointer"
        class:selected-word={isSelected}
        onclick={() => handleDictionaryWordClick(word, section)}>
        <span class="whitespace-nowrap overflow-hidden max-w-0 transition-all duration-200"
            class:max-w-0={!isSelected}
            style={isSelected ? `max-width: calc(${word.length}ch + 6rem)` : ''}>
            define "
        </span>
        <span>{word}</span>
        <span class:max-w-0={!isSelected}>"</span>
    </button>
{/snippet}

<div
    transition:slide={{ delay }}
    class="game-over h-full grid grid-rows-4 bg-surface border border-border"
>
    <div class="flex gap-1 w-full min-h-0 p-2">
        {@render chartBar(0, scores.you, "You!")}
        {@render chartBar(1, scores.opponent, opponentName)}
        {#if game.averageGameScore}
            {@render chartBar(2, game.averageGameScore, "Average")}
        {:else}
            <div class="w-full flex justify-center items-center">
                <img
                    style="opacity: {Number(mounted) * 100}%; {getDelayStyle(2)}"
                    src="{favicon}" alt="" class="w-8 h-8 transition-all duration-500 animate-[spin_2s_linear_infinite]">
            </div>
        {/if}
    </div>
    <div class="row-span-2 overflow-y-scroll p-2">
        <h3 class="font-bold">{opponentName}'s words</h3>
        <ul class=" flex flex-wrap gap-2 h-min">
            {#each opponentWordMap as [word, wasFound]}
                <li class:found={wasFound}>
                    {@render dictionaryWord(word, "opponent")}
                </li>
            {/each}
        </ul>

        <hr class="my-4"/>

        <h3 class="font-bold">Your words</h3>
        <ul class="flex flex-wrap gap-2 h-min">
            {#each playerWordMap as [word, wasFound]}
                <li class:unique={wasFound}>
                    {@render dictionaryWord(word, "player")}
                </li>
            {/each}
        </ul>

        <hr class="my-4"/>

        <h3 class="font-bold">All words</h3>
        <p class="italic text-accent">Click on a word to see its definition</p>
        <ul class="flex flex-wrap gap-2 h-min">
            {#each totalWordsMap as [word]}
                <li>
                    {@render dictionaryWord(word, "total")}
                </li>
            {/each}
        </ul>
    </div>
    <div class="bubble-container flex gap-1 flex-col [align-items:end]">
        <div class="imessage-bubble">
            {#if didWin}
                I beat {opponentName} at Boggle!
            {:else}
                I couldn't quite beat {opponentName} at Boggle :{"("}
            {/if}
            <div class="bubble-tail"></div>
        </div>
        <button
            class="imessage-bubble underline cursor-pointer"
            onclick={() => challengeManager.showChallenge = true}
        >
            Challenge someone else!
            <div class="bubble-tail"></div>
        </button>
    </div>
</div>

<style>
    li {
        interpolate-size: allow-keywords;
        width: max-content;
        transition: all 200ms ease;

    }

    li:has(.selected-word) {
        width: max-content;
        /*border: 1px solid var(--color-border);*/
        text-decoration: underline;
        background-color: var(--color-foreground);
        color: var(--color-surface);
    }

    .move {
        position: unset;
        color: var(--color-foreground);
    }

    .bar {
        background-color: var(--color-foreground);
    }

    .bar.player {
        background-color: var(--color-muted);
    }

    .found {
	    background-color: var(--color-muted);
	    color: var(--color-surface);
    }

    .found::after {
    	content: "you found!";
    	position: absolute;
    	font-size: xx-small;
    	left: 50%;
    	transform: translateX(-50%);
    	bottom: -6px;
    }

    .unique {
    	position: relative;
    }

    .unique:has(.selected-word)::after {
        display: none;
    }

    .unique::after {
    	content: "unique!";
    	position: absolute;
    	font-size: xx-small;
    	left: 50%;
    	transform: translateX(-50%);
    	bottom: -6px;
    }

    :global(.bubble-container) {
        padding: 0.5rem;
    }

    :global(.imessage-bubble) {
        position: relative;
        background: var(--color-foreground);
        color: var(--color-surface);
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro",
            "Helvetica Neue", sans-serif;
        font-size: 0.85rem;
        padding: 0.5rem 0.75rem;
        border-radius: 1rem;
        border-bottom-right-radius: 0.25rem;
        max-width: 85%;
        line-height: 1.3;
    }

    :global(.bubble-tail) {
        position: absolute;
        bottom: 0;
        right: -6px;
        width: 12px;
        height: 12px;
        background: var(--color-foreground);
        clip-path: polygon(0 0, 0% 100%, 100% 100%);
        border-bottom-right-radius: 0.5rem;
    }
</style>
