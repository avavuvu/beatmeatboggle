<script lang="ts">
    import { onMount } from "svelte"
    import { fade, slide } from "svelte/transition"
    import JSConfetti from "js-confetti"

    import { reveal } from "$lib/reveal"
    import type GameManager from "$lib/GameManager.svelte"
    import { challengeManager } from "$lib/challenge/challenge.svelte"
    import definitionManager from "$lib/DefinitionManager.svelte"
    import { fetchDayPlayStats, type DayPlayStats } from "$lib/dayPlayStats"
    import { isRare, RARE_MISSED_SHARE, shareOf } from "$lib/rarity"
    import { formatPercentage, getPercentile } from "$lib/statsCalculations"
    import { logo } from "./icons/logo.svelte"
    import WordList from "./WordList.svelte"
    import WordButton from "./WordButton.svelte"

    let {
        game,
        selectedWord = $bindable(null),
    }: {
        game: GameManager
        selectedWord?: string | null
    } = $props()

    // svelte-ignore state_referenced_locally
    const { session, foundWords } = game

    const {
        opponentName,
        scores,
        didWin,
        opponentWords,
        playerWords,
        missedWords,
        foundByYou,
        uniqueToYou,
    } = reveal({ session, foundWords })

    const isPractice = session.playerState === "practice"
    const seedWord = session.seedWord

    const delay = 1000

    const topScore = $derived(
        Math.max(scores.you, scores.opponent, game.averageGameScore ?? 0, 1)
    )

    const delayStyle = (index: number) =>
        `animation-delay: ${delay + index * 400}ms;`

    let dayStats = $state<DayPlayStats | null>(null)

    const shares = $derived(dayStats?.shares ?? null)

    const percentile = $derived.by(() => {
        const distribution = dayStats?.distribution
        if (!distribution) return null
        const players = distribution.reduce(
            (total, { count }) => total + count,
            0
        )
        return getPercentile(distribution, players, scores.you)
    })

    const rare = (word: string) => isRare({ word, shares })
    const rareMissed = (word: string) =>
        isRare({ word, shares, threshold: RARE_MISSED_SHARE })
    const selectedShare = $derived(
        selectedWord ? shareOf({ word: selectedWord, shares }) : null
    )

    const onWordClick = (word: string) => {
        challengeManager.showChallenge = false

        if (selectedWord === word) {
            definitionManager.setWord(word)
            return
        }

        definitionManager.clearWord()
        selectedWord = word
    }

    const openChallenge = () => {
        definitionManager.clearWord()
        challengeManager.showChallenge = true
    }

    onMount(() => {
        if (isPractice) return

        fetchDayPlayStats(session.dateKey).then((stats) => {
            dayStats = stats
        })
    })

    onMount(() => {
        if (!didWin) return

        const confetti = new JSConfetti()
        confetti.addConfetti({ confettiRadius: 6 })

        return () => confetti.destroyCanvas()
    })
</script>

{#snippet chartBar(index: number, score: number, name: string)}
    <div
        class="flex flex-col w-full min-w-0 justify-end text-sm text-center relative"
    >
        <div
            class="appear text-center w-full text-surface absolute"
            class:move={score < 40}
            style={delayStyle(index)}
        >
            <p class="truncate px-1">{name}</p>
            <p>{Math.floor(score)}</p>
        </div>
        <div
            class="bar rise"
            class:player={index === 0}
            style="height: {(score / topScore) * 100}%; {delayStyle(index)}"
        ></div>
    </div>
{/snippet}

<div
    transition:slide={{ delay }}
    class="h-full grid grid-rows-[minmax(0,1fr)_minmax(0,2fr)_auto] bg-surface border border-border"
>
    <div class="grid grid-rows-[minmax(0,1fr)] min-h-0 p-2">
        <div class="flex gap-1 min-h-0 [grid-area:1/1]">
            {@render chartBar(0, scores.you, "You!")}
            {#if isPractice}
                <a
                    href="/practice"
                    class="appear w-full flex justify-center items-center underline text-center"
                    style={delayStyle(1)}
                >
                    Play Again
                </a>
            {:else}
                {@render chartBar(1, scores.opponent, opponentName)}
                {#if game.averageGameScore !== undefined}
                    {@render chartBar(2, game.averageGameScore, "Average")}
                {:else}
                    <div
                        class="w-full flex justify-center items-center"
                        role="status"
                        aria-label="Loading the average score"
                    >
                        <div
                            class="appear w-8 h-8 animate-[spin_2s_linear_infinite]"
                            style={delayStyle(2)}
                        >
                            {@render logo()}
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
        {#if selectedWord && selectedShare !== null}
            <div
                transition:fade={{ duration: 150 }}
                class="z-10 grid grid-rows-[auto_1fr] [grid-area:1/1] bg-surface"
            >
                <button
                    class="justify-self-end px-1 cursor-pointer underline"
                    onclick={() => (selectedWord = null)}
                >
                    Close
                </button>
                <div class="flex flex-col items-center justify-center">
                    <span class="text-lg font-bold">{selectedWord}</span>
                    <span>
                        found by {formatPercentage(selectedShare * 100)} of players
                    </span>
                </div>
            </div>
        {/if}
    </div>
    <div class="overflow-y-auto p-2">
        {#if !isPractice}
            <h2 class="font-bold">{opponentName}'s words</h2>
            <p class="italic text-accent">
                Tap a word to see its definition
            </p>
            <WordList
                words={opponentWords}
                {selectedWord}
                {onWordClick}
                marks={(word) => ({
                    found: foundByYou.has(word),
                    rare: rare(word),
                })}
            />

            <hr class="my-4" />
        {/if}

        <h2 class="font-bold">Your words</h2>
        <WordList
            words={playerWords}
            {selectedWord}
            {onWordClick}
            marks={(word) => ({
                unique: uniqueToYou.has(word),
                rare: rare(word),
            })}
        />
            <div class="bg-foreground text-surface my-4 p-2 -mx-2">
                {#if seedWord}
                    <p>
                        {#if foundByYou.has(seedWord)}
                            You found the <a href="/about/boards" class="underline">hidden word</a>! Which today was
                        {:else}
                            The <a href="/about/boards" class="underline">hidden word</a> today was
                        {/if}
                        <span class="font-bold"
                            ><WordButton
                                word={seedWord}
                                selected={selectedWord === seedWord}
                                onclick={() => onWordClick(seedWord)}
                                inverted
                            /></span
                        >.
                    </p>
                    <br/>
                {/if}

                {#if percentile !== null}
                    <p>
                        You did better than {formatPercentage(percentile)} of players
                    </p>
                {/if}
                <p>
                    {#if session.isArchive}
                        <a href="/stats/{session.dateKey}" class="underline">Click here to see the full stats for this board</a>
                    {:else}
                        <a href="/stats" class="underline">Click here to see how you did on yesterday's board</a>
                    {/if}
                </p>
            </div>



        <h2 class="font-bold">Missed words</h2>
        <WordList
            words={missedWords}
            {selectedWord}
            {onWordClick}
            marks={(word) => ({ rare: rareMissed(word) })}
            rareLabel={false}
        />
    </div>
    <div class="bubble-container flex gap-1 flex-col [align-items:end]">
        <div class="imessage-bubble">
            {#if isPractice}
                Nice game!
            {:else if didWin}
                I beat {opponentName} at Boggle!
            {:else}
                I couldn't quite beat {opponentName} at Boggle :{"("}
            {/if}
            <div class="bubble-tail"></div>
        </div>
        {#if !isPractice}
            <button
                class="imessage-bubble underline cursor-pointer"
                onclick={openChallenge}
            >
                Challenge someone else!
                <div class="bubble-tail"></div>
            </button>
        {/if}
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

    .appear {
        animation: appear 500ms ease-out both;
    }

    .rise {
        animation: rise 500ms ease-out both;
    }

    @keyframes appear {
        from {
            opacity: 0;
        }
    }

    @keyframes rise {
        from {
            height: 0;
        }
    }
</style>
