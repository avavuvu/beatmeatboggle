<script lang="ts">
    import scoreTracker from "$lib/ScoreTracker.svelte";
    import JSConfetti from "js-confetti";
    import { page } from "$app/state";
    import { fade, slide } from "svelte/transition";
    import preferences from "$lib/Preferences.svelte"
    import type GameManager from "$lib/GameManager.svelte"
    import favicon from "$lib/assets/favicon.svg"
    import WordList from "./WordList.svelte"
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

    const opponentWords = $derived(opponentWordMap.map(([word]) => word))
    const opponentFoundWords = $derived(
        new Set(opponentWordMap.filter(([, wasFound]) => wasFound).map(([word]) => word))
    )

    const playerWords = $derived(playerWordMap.map(([word]) => word))
    const playerUniqueWords = $derived(
        new Set(playerWordMap.filter(([, isUnique]) => isUnique).map(([word]) => word))
    )

    const totalWords = $derived(totalWordsMap.map(([word]) => word))
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
        <WordList
            words={opponentWords}
            itemClass={(word) => opponentFoundWords.has(word) ? "found" : undefined}
        />

        <hr class="my-4"/>

        <h3 class="font-bold">Your words</h3>
        <WordList
            words={playerWords}
            itemClass={(word) => playerUniqueWords.has(word) ? "unique" : undefined}
        />

        <hr class="my-4"/>

        <h3 class="font-bold">All words</h3>
        <p class="italic text-accent">Click on a word to see its definition</p>
        <WordList words={totalWords} />
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
