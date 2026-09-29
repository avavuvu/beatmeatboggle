<script lang="ts">
    import type { DayStats } from "$lib/statsTypes"
    import { dateFromKey } from "$lib/constants"
    import { formatDateKey } from "$lib/dates"
    import { WEEKDAYS, weekDayMap } from "$lib/board"
    import {
        formatCountry,
        formatPercentage,
        getAverageScore,
        getBeatScorePercentage,
        getPercentile,
        getRank,
    } from "$lib/statsCalculations"
    import StatsHistogram from "@/stats/StatsHistogram.svelte"

    const {
        data,
        playerScore,
        playerWordCount,
    }: {
        data: DayStats
        playerScore: number | null
        playerWordCount: number | null
    } = $props()

    const { distribution, players, avasScore, topPlayer } = $derived(data.scores)

    const dateFormatted = $derived(formatDateKey(data.dateKey))
    const weekday = $derived(WEEKDAYS[dateFromKey(data.dateKey).getUTCDay()])
    const dice = $derived(weekDayMap[weekday].dice)

    const averageScore = $derived(getAverageScore(distribution, players))

    const scoreDifference = $derived(
        playerScore !== null && avasScore !== null
            ? Math.abs(playerScore - avasScore)
            : null
    )

    const didWin = $derived(
        playerScore !== null && avasScore !== null && playerScore > avasScore
    )

    const beatAvaPercentage = $derived(
        avasScore !== null
            ? getBeatScorePercentage(distribution, players, avasScore)
            : null
    )

    const playerPercentile = $derived(
        playerScore !== null
            ? getPercentile(distribution, players, playerScore)
            : null
    )

    const playerRank = $derived(
        playerScore !== null ? getRank(distribution, playerScore) : null
    )
</script>

<p>
    {dateFormatted} was a <strong>{weekday}</strong> board; a <strong>{data.size}x{data.size}</strong> grid using
    <strong>
        {#if dice === "classic"}
            classic boggle dice generation
        {:else if dice === "word"}
            word-based generation
        {:else}
            other generation
        {/if}
    </strong>.
</p>

{#if playerScore !== null}
    <p>
        You found {playerWordCount} words, achieving a score of {playerScore}.

        {#if scoreDifference !== null}
            {#if didWin}
                You beat Ava by {scoreDifference} points.
            {:else}
                You didn't beat Ava by {scoreDifference} points.
            {/if}
        {/if}
    </p>

    {#if playerPercentile !== null && playerRank !== null}
        <p>
            You scored more than <strong>{formatPercentage(playerPercentile)}</strong> of players,
            and placed <strong>#{playerRank}</strong>.
        </p>
    {/if}
{/if}

{#if averageScore !== null}
    <p>The average score was <strong>{Math.round(averageScore)} points</strong>.</p>
{/if}

{#if topPlayer}
    <p>
        The best score was
        {#if topPlayer.country}
            a player from
            <strong>
                {formatCountry(topPlayer.country)}
            </strong>,
        {/if}
        with <strong> {topPlayer.score} points</strong>, finding
        <strong>{topPlayer.words} words</strong>.

        {#if averageScore !== null}
            It was <strong>{Math.round(topPlayer.score - averageScore)}</strong> points better than the average.
        {/if}
    </p>
{/if}

{#if beatAvaPercentage !== null}
    <p><strong>{formatPercentage(beatAvaPercentage)}</strong> of players beat Ava.</p>
{/if}

<StatsHistogram {distribution} {avasScore} {playerScore} {averageScore} />
