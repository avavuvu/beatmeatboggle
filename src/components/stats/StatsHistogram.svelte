<script lang="ts">
    import type { ScoreCount } from "$lib/statsTypes"
    import { fade } from "svelte/transition"

    type Bin = {
        binStart: number
        binEnd: number
        count: number
        isAva?: boolean
        isPlayer?: boolean
        isAverage?: boolean
    }

    const BIN_SIZE = 20
    const BAR_START_DELAY_MS = 200
    const BAR_STEP_DELAY_MS = 100

    const {
        distribution,
        avasScore,
        playerScore,
        averageScore,
    }: {
        distribution: ScoreCount[]
        avasScore: number | null
        playerScore: number | null
        averageScore: number | null
    } = $props()

    const getBinIndex = (score: number) => Math.floor(score / BIN_SIZE)

    const getDelayStyle = (index: number) =>
        `transition-delay: ${BAR_START_DELAY_MS + index * BAR_STEP_DELAY_MS}ms;`

    const histogram: Bin[] = $derived.by(() => {
        if (distribution.length === 0) {
            return []
        }

        const maxScore = Math.max(
            distribution.at(-1)!.score,
            avasScore ?? 0,
            playerScore ?? 0,
            averageScore ?? 0
        )

        const bins: Bin[] = Array.from(
            { length: getBinIndex(maxScore) + 1 },
            (_, i) => ({
                binStart: i * BIN_SIZE,
                binEnd: (i + 1) * BIN_SIZE,
                count: 0,
            })
        )

        for (const { score, count } of distribution) {
            bins[getBinIndex(score)].count += count
        }

        if (avasScore !== null) {
            bins[getBinIndex(avasScore)].isAva = true
        }

        if (playerScore !== null) {
            bins[getBinIndex(playerScore)].isPlayer = true
        }

        if (averageScore !== null) {
            bins[getBinIndex(averageScore)].isAverage = true
        }

        return bins
    })

    const topCount = $derived(Math.max(1, ...histogram.map(({ count }) => count)))
</script>

{#snippet chartBar(index: number, bin: Bin, name: string)}
    {@const heightRatio = bin.count / topCount}
    <div
        in:fade
        class="flex flex-col w-full h-full justify-end text-xs text-center"
    >
        <div
            class="bar relative transition-all duration-500 ease-out"
            class:player={bin.isPlayer}
            class:ava={bin.isAva}
            class:average={bin.isAverage}
            style="--height: {heightRatio * 100}%; {getDelayStyle(index)}"
        >
            <div
                class="bar-labels text-center w-full absolute transition-opacity duration-500"
                class:move={heightRatio < 0.25}
                style={getDelayStyle(index)}
            >
                {#if bin.isPlayer}
                    <div class="player-label">You!</div>
                {/if}
                {#if bin.isAva}
                    <div class="ava-label">Ava</div>
                {/if}
            </div>
        </div>
    </div>
{/snippet}

<div class="legend">
    {#if playerScore !== null}
        <div>
            <span class="square player"></span>
            You
        </div>
    {/if}
    {#if avasScore !== null}
        <div>
            <span class="square ava"></span>
            Ava
        </div>
    {/if}
    <div>
        <span class="square average"></span>
        Average
    </div>
</div>

<div class="flex gap-1 w-full h-48">
    {#each histogram as bin, index (bin.binStart)}
        {@render chartBar(index, bin, `${bin.binStart}–${bin.binEnd - 1}`)}
    {/each}
</div>

<style>
    .bar {
        height: var(--height);
    }

    .bar-labels {
        top: 0;
    }

    .bar-labels.move {
        top: auto;
        bottom: 100%;
    }

    @starting-style {
        .bar {
            height: 0;
        }

        .bar-labels {
            opacity: 0;
        }
    }

    .bar, .square {
        --ava-pattern: repeating-linear-gradient(
            -45deg,
            transparent 0 3px,
            var(--color-surface) 3px 4px
        );
        --average-pattern: repeating-linear-gradient(
            45deg,
            transparent 0 5px,
            var(--color-surface) 5px 8px
        );

        background-color: var(--color-foreground);
    }

    .bar.player, .square.player {
        background-color: var(--color-muted);
    }

    .ava-label, .player-label {
        color: var(--color-surface);
    }

    .ava-label {
        background-color: var(--color-foreground);
    }

    .player-label {
        background-color: var(--color-muted);
    }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;

        & > * {
            display: inline-flex;
            align-items: center;
            gap: 0.5em;
        }
    }

    .square {
        flex-shrink: 0;
        width: 1.25em;
        height: 1.25em;
    }

    .bar.average, .square.average {
        background-image: var(--average-pattern);
    }

    .bar.ava, .square.ava {
        background-image: var(--ava-pattern);
    }

    .bar.ava.average {
        background-image: var(--ava-pattern), var(--average-pattern);
    }
</style>
