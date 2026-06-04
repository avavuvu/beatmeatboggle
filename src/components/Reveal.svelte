<script lang="ts">
    import scoreManager from "$lib/ScoreManager.svelte";
    import JSConfetti from "js-confetti";
    import { page } from "$app/state";
    import { slide } from "svelte/transition";
    import settingsManager from "$lib/SettingsManager.svelte"
    import definitionManaager from "$lib/DefinitionManager.svelte"

    const getReveal = async () => {
        const reveal = await scoreManager.getReveal();

        didWin = reveal.didWin;
        shareLink = reveal.shareLink;

        return reveal;
    };

    let didWin = $state(false);
    let shareLink = $state(page.url.origin);

    let shareButtonText = $state("Share");

    const shareText = $derived(
        didWin
            ? `I beat Ava at Boggle!${settingsManager.settings.fairFight.value && " (And it was a fair fight!"}`
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

    let selectedWord = $state("")
    const handleDictionaryWordClick = async (word: string, section: "ava" | "player" | "total") => {
        const id = `${word}-${section}`

        if(selectedWord === id) {
            // fetch definition
            await definitionManaager.setWord(word)
            return
        }

        selectedWord = id
    }
</script>

{#snippet dictionaryWord(word: string, section: "ava" | "player" | "total")}
    {@const isSelected = selectedWord === `${word}-${section}`}
	<button
        class="flex overflow-hidden"
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

{#await getReveal() then { scores, totalWordSet, didWin, avasWordMap, playerWordMap, totalWordsMap }}
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
                        class="text-center w-full text-surface absolute transition-all duration-500"
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
                        class:player={name === "You!"}
                        class="bar text-xs text-surface transition-all duration-500 ease-out"
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
                        {@render dictionaryWord(word, "ava")}
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
