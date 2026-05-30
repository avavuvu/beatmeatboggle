<script lang="ts">
    import scoreTracker from "$lib/ScoreTracker.svelte";
    import JSConfetti from "js-confetti";
    import { page } from "$app/state";
    import { fade, slide } from "svelte/transition";
    import preferences from "$lib/Preferences.svelte"
    import type GameSession from "$lib/GameSession.svelte"
    import favicon from "$lib/assets/favicon.svg"

    const { session }: {
        session: GameSession
    }  = $props()

    const {
        scores,
        totalWordSet,
        didWin,
        avasWordMap,
        playerWordMap,
        totalWordsMap
    } = scoreTracker.getReveal(session.foundWords, session.totalPossibleWords)

    let average = $state(() => session.averageGameScore)

    let shareLink = $state(page.url.origin);

    let shareButtonText = $state("Share");

    const shareText = $derived(
        didWin
            ? `I beat Ava at Boggle!${preferences.settings.fairFight.value && " (And it was a fair fight!)"}`
            : "I couldn't quite beat Ava at Boggle :(",
    );

    const share = async () => {
        const data = { title: "Boggle", text: shareText, shareLink };

        if (navigator.share) {
            await navigator.share(data);
        } else {
            await navigator.clipboard.writeText(shareLink);
            shareButtonText = "Copied to Clipboard";
        }
    };

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
        {@render chartBar(1, scores.ava, "Ava")}
        {#if session.averageGameScore}
            {@render chartBar(2, session.averageGameScore, "Average")}
        {:else}
            <div class="w-full flex justify-center items-center">
                <img
                    style="opacity: {Number(mounted) * 100}%; {getDelayStyle(2)}"
                    src="{favicon}" alt="" class="w-8 h-8 transition-all duration-500 animate-[spin_2s_linear_infinite]">
            </div>
        {/if}
    </div>
    <div class="row-span-2 overflow-y-scroll p-2">
        <h3 class="font-bold">Ava's words</h3>
        <ul class=" flex flex-wrap gap-2 h-min">
            {#each avasWordMap as [word, wasFound]}
                <li class:found={wasFound}>
                    {word}
                </li>
            {/each}
        </ul>

        <hr class="my-4"/>

        <h3 class="font-bold">Your words</h3>
        <ul class="flex flex-wrap gap-2 h-min">
            {#each playerWordMap as [word, wasFound]}
                <li class:unique={wasFound}>
                    {word}
                </li>
            {/each}
        </ul>

        <hr class="my-4"/>

        <h3 class="font-bold">All words</h3>
        <ul class="flex flex-wrap gap-2 h-min">
            {#each totalWordsMap as [word]}
                <li>
                    {word}
                </li>
            {/each}
        </ul>
    </div>
    <div class="bubble-container flex gap-1 flex-col [align-items:end]">
        <div class="imessage-bubble">
            {#if didWin}
                I beat Ava at Boggle!
            {:else}
                I couldn't quite beat Ava at Boggle :{"("}
            {/if}
            <div class="bubble-tail"></div>
        </div>
        <button
            class="imessage-bubble underline cursor-pointer"
            onclick={share}
        >
            {shareButtonText}
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

    .unique::after {
    	content: "unique!";
    	position: absolute;
    	font-size: xx-small;
    	left: 50%;
    	transform: translateX(-50%);
    	bottom: -6px;
    }

    .bubble-container {
        padding: 0.5rem;
    }

    .imessage-bubble {
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

    .bubble-tail {
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
