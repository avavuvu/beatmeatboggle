<script lang="ts">
    import gameManager from "$lib/GameManager.svelte";
    import Board from "./Board.svelte";
    import Input from "./Input.svelte";
    import Reveal from "./Reveal.svelte";
    import Toast from "./Toast.svelte";

    const minutes = $derived(Math.floor(gameManager.secondsLeft / 60));
    const seconds = $derived(gameManager.secondsLeft % 60);
    const timeDisplay = $derived(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    );

    const {
        dateKey,
        playerStatus,
        avasWords,
        histogram,
    }: {
        dateKey: string;
        playerStatus: "ava" | "player";
        avasWords: null | string[];
        histogram: any;
    } = $props();

    // svelte-ignore state_referenced_locally
    gameManager.init(dateKey, playerStatus, avasWords, histogram);
</script>

<div class="game-container text-foreground">
    <div class="game-grid">
        <div class="timer edge">
            <div class:urgent={gameManager.secondsLeft <= 30}>
                {timeDisplay}
            </div>
        </div>
        <div class="board">
            <Board />
        </div>
        <div class="words edge">
            <ul class="p-2 flex flex-wrap gap-2">
                {#each gameManager.foundWords.toSorted() as word}
                    <li>
                        {word}
                    </li>
                {/each}
            </ul>
        </div>
        <div class="backspace edge">
            <button
                onclick={() => gameManager.removeLast()}
                aria-label="backspace"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="90%"
                    height="90%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-delete-icon lucide-delete"
                    ><path
                        d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"
                    /><path d="m12 9 6 6" /><path d="m18 9-6 6" /></svg
                >
            </button>
        </div>
        <div class="submit edge">
            <button
                aria-label="submit"
                onclick={() => gameManager.submitWord()}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="90%"
                    height="90%"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-corner-down-left-icon lucide-corner-down-left"
                    ><path d="M20 4v7a4 4 0 0 1-4 4H4" /><path
                        d="m9 10-5 5 5 5"
                    /></svg
                >
            </button>
        </div>
        <div class="gutter">
            <Toast />
        </div>
        <div class="banner edge">
            <img class="h-full w-min p-2" src="Asset 22.svg" alt="" />
        </div>
        <div class="reveal">
            {#if gameManager.gameOver}
                <Reveal />
            {/if}
        </div>
    </div>
</div>

<Input />

<style>
    .game-container {
        --cols: 7;
        --rows: 4;
        max-height: 100dvh;
        aspect-ratio: var(--cols) / var(--rows);
        padding: 4rem;
        margin: 0 auto;
    }

    .edge {
        border: 1px solid var(--color-border);
    }

    .game-grid {
        border: 1px solid var(--color-border);
        display: grid;
        height: 100%;
        aspect-ratio: var(--cols) / var(--rows);

        grid-template-columns: repeat(var(--cols), 1fr);
        grid-template-rows: repeat(var(--rows), 1fr);
        gap: 0px 0px;
    }
    .board {
        grid-area: 1 / 2 / 5 / 6;
    }
    .banner {
        grid-area: 1 / 1 / 5 / 2;
    }
    .timer {
        grid-area: 1 / 6 / 2 / 8;
    }
    .words {
        grid-area: 2 / 6 / 4 / 8;
    }
    .gutter {
        grid-area: 2 / 6 / 4 / 8;
    }
    .submit {
        grid-area: 4 / 6 / 5 / 7;
    }
    .backspace {
        grid-area: 4 / 7 / 5 / 8;
    }
    .reveal {
        grid-area: 1 / 6 / 5 / 8;
    }

    @media (max-width: 600px) {
        .game-container {
            --cols: 4;
            --rows: 10;
            max-height: unset;
            aspect-ratio: var(--cols) / var(--rows);
            padding: 0;
        }

        .game-grid {
            display: grid;
            aspect-ratio: var(--cols) / var(--rows);
            grid-template-columns: repeat(var(--cols), 1fr);
            grid-template-rows: repeat(var(--rows), 1fr);
            gap: 0px 0px;
            grid-template-areas:
                "banner banner banner timer"
                "board board board board"
                "board board board board"
                "board board board board"
                "board board board board"
                "gutter gutter gutter gutter"
                "gutter gutter gutter gutter";
        }
        .words {
            grid-area: 6 / 1 / 8 / 3;
        }

        .reveal {
            grid-area: 6 / 1 / 10 / 5;
        }
        .submit {
            grid-area: 6 / 3 / 7 / 4;
        }
        .backspace {
            grid-area: 6 / 4 / 7 / 5;
        }
        .timer {
            grid-area: timer;
        }
        .board {
            grid-area: board;
        }
        .gutter {
            grid-area: gutter;
        }
        .banner {
            grid-area: banner;
        }
    }

    .found {
        color: blue;
    }

    .player {
        background-color: blue;
    }

    .timer {
        font-size: 1.5rem;
        font-variant-numeric: tabular-nums;
        font-weight: bold;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
