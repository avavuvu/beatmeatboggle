<script lang="ts">
    import scoreManager from "$lib/ScoreManager.svelte";
    import JSConfetti from "js-confetti";
    import { page } from "$app/state";
    import { slide } from "svelte/transition";

    const getReveal = async () => {
        const reveal = await scoreManager.getReveal();

        didWin = reveal.didWin;

        return reveal;
    };

    let didWin = $state(false);

    let shareButtonText = $state("Share");

    const shareText = $derived(
        didWin
            ? "I beat Ava at Boggle!"
            : "I couldn't quite beat Ava at Boggle :(",
    );

    const share = async () => {
        const url = page.url.origin;
        const data = { title: "Boggle", text: shareText, url };

        if (navigator.share) {
            await navigator.share(data);
        } else {
            await navigator.clipboard.writeText(`${shareText}\n${url}`);
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
</script>

{#await getReveal() then { scores, totalWordSet, didWin, avasWordMap, totalWordsMap }}
    <div
        transition:slide={{ delay }}
        class="game-over h-full grid grid-rows-4 bg-surface border border-border"
    >
        <div class="flex gap-1 w-full min-h-0 p-2">
            {#each scores as [name, score], index}
                <div
                    class="flex flex-col w-full justify-end text-sm text-center relative"
                >
                    <div
                        class="text-center w-full text-white absolute transition-all duration-500"
                        class:move={Number(score) < 40}
                        style="opacity: {Number(mounted) *
                            100}%; transition-delay: {delay + index * 400}ms;"
                    >
                        <p>{name}</p>
                        <p>
                            {Math.floor(Number(score))}
                        </p>
                    </div>
                    <div
                        class:player={score === "You!"}
                        class="bar text-xs text-white transition-all duration-500 ease-out"
                        style="height: {mounted
                            ? (Number(score) / totalWordSet.size) * 100
                            : 0}%; transition-delay: {delay + index * 400}ms;"
                    ></div>
                </div>
            {/each}
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
            <hr />
            <h3 class="font-bold">All words</h3>
            <ul class="flex flex-wrap gap-2 h-min">
                {#each totalWordsMap as [word, wasFound]}
                    <li class:found={wasFound}>
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
{/await}

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
        color: var(--color-black);
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
