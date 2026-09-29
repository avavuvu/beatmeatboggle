<script lang="ts">
    import type { DayStats, WordStat } from "$lib/statsTypes"
    import { loadGameState } from "$lib/session/gameState"
    import { loadDirtyWords } from "$lib/dictionary/load"
    import { calculateTotalPoints } from "$lib/scoring"
    import preferences from "$lib/Preferences.svelte"
    import {
        formatPercentage,
        getAverageFoundWordLength,
        getBestWord,
        getFoundPercentage,
        getFoundTogetherPercentage,
        getLongestWord,
        getMostCommonMissedWords,
        getRarestWords,
    } from "$lib/statsCalculations"
    import StatsSummary from "@/stats/StatsSummary.svelte"
    import StatsBoard from "@/stats/StatsBoard.svelte"
    import StatsWordTable from "@/stats/StatsWordTable.svelte"

    const LIST_LIMIT = 5

    const { data }: { data: DayStats } = $props()

    let playerScore = $state<number | null>(null)
    let foundWords = $state<string[] | null>(null)

    const playerWordCount = $derived(foundWords?.length ?? null)

    const longestWord = $derived(getLongestWord(data.words))
    const bestWord = $derived(getBestWord(data.words))
    const averageWordLength = $derived(getAverageFoundWordLength(data.words))
    const foundTogetherPercentage = $derived(getFoundTogetherPercentage(data.words))

    const freakWords = $derived(
        data.words.filter(({ plays }) => plays === 0).map(({ word }) => word)
    )

    const playerFoundPercentage = $derived(
        foundWords ? getFoundPercentage(data.words, foundWords) : null
    )

    const playerRarestWord = $derived(
        foundWords ? (getRarestWords(data.words, foundWords, 1)[0] ?? null) : null
    )

    const playerMissedWords = $derived(
        foundWords ? getMostCommonMissedWords(data.words, foundWords, LIST_LIMIT) : []
    )

    const avaRareWords = $derived(
        data.scores.avasWords ? getRarestWords(data.words, data.scores.avasWords, LIST_LIMIT) : []
    )

    const avaMissedWords = $derived(
        data.scores.avasWords
            ? getMostCommonMissedWords(data.words, data.scores.avasWords, LIST_LIMIT)
            : []
    )

    $effect(() => {
        const { dateKey } = data
        const { avasWords } = data.scores
        const saved = loadGameState(dateKey)

        playerScore = null
        foundWords = null

        if (!saved?.gameOver || saved.foundWords.length === 0) {
            return
        }

        foundWords = saved.foundWords

        let cancelled = false

        loadDirtyWords().then(() => {
            if (cancelled) return

            playerScore = calculateTotalPoints(
                saved.foundWords,
                avasWords ?? [],
                true,
                preferences.settings.fairFight.value
            )
        })

        return () => {
            cancelled = true
        }
    })
</script>

{#snippet wordList(entries: WordStat[])}
    <ul class="freakwords">
        {#each entries as { word, percentage } (word)}
            <li><span class="uppercase">{word}</span> ({formatPercentage(percentage)})</li>
        {/each}
    </ul>
{/snippet}

<section>
    <StatsSummary {data} {playerScore} {playerWordCount} />
</section>

<section>
    <StatsBoard size={data.size} letters={data.letters} />
</section>

<section>
    {#if longestWord}
        <p>
            <strong class="block">
                The longest possible word was <span class="uppercase">{longestWord.word}</span>
            </strong>
            Which was only found by {longestWord.plays} players.
        </p>
    {/if}

    {#if averageWordLength !== null}
        <p>The average word found was <strong>{averageWordLength.toFixed(1)}</strong> letters long.</p>
    {/if}

    {#if bestWord}
        <p>
            <strong class="block">
                The best word was <span class="uppercase">{bestWord.word}</span>
            </strong>
            It earned players the most points in total. {formatPercentage(bestWord.percentage)} of players found it.
        </p>
    {/if}

    <p>
        Together, players found <strong>{formatPercentage(foundTogetherPercentage)}</strong> of all possible words.
    </p>

    {#if freakWords.length !== 0}
        <h2 class="font-bold">Freak words</h2>

        <p>These freaky words were not played by anyone:</p>
        <ul class="freakwords">
            {#each freakWords as word (word)}
                <li class="uppercase">{word}</li>
            {/each}
        </ul>
    {/if}
</section>

{#if foundWords}
    <section>
        {#if playerFoundPercentage !== null}
            <p>
                <strong>You found {formatPercentage(playerFoundPercentage)} of all possible words.</strong>
            </p>
        {/if}

        {#if playerRarestWord}
            <p>
                <strong class="block">
                    Your rarest word was <span class="uppercase">{playerRarestWord.word}</span>.
                </strong>
                Only {formatPercentage(playerRarestWord.percentage)} of players found it.
            </p>
        {/if}

        {#if playerMissedWords.length > 0}
            <h2 class="font-bold">Common words you missed:</h2>
            {@render wordList(playerMissedWords)}
        {/if}
    </section>
{/if}

{#if data.scores.avasWords}
    <section>
        {#if avaRareWords.length > 0}
            <h2 class="font-bold">Ava's rarest words:</h2>
            {@render wordList(avaRareWords)}
        {/if}

        {#if avaMissedWords.length > 0}
            <h2 class="font-bold">Common words Ava missed:</h2>
            {@render wordList(avaMissedWords)}
        {/if}
    </section>
{/if}

<section>
    <StatsWordTable words={data.words} />
</section>

<style>
    .freakwords {
        display: flex;
        gap: 0.25em 1em;
        flex-wrap: wrap;
    }

    section {
        border: 1px solid var(--color-foreground);
        margin-bottom: 1em;
        padding: 1em;
    }
</style>
