<script lang="ts">
    import gameManager from "$lib/GameManager.svelte";
    import type { ScoreManagerInitData } from "$lib/ScoreManager.svelte";
    import Board from "./Board.svelte";
    import Input from "./Input.svelte";
    import Logo from "./Logo.svelte";
    import Reveal from "./Reveal.svelte";
    import Toast from "./Toast.svelte";

    const minutes = $derived(Math.floor(gameManager.secondsLeft / 60));
    const seconds = $derived(gameManager.secondsLeft % 60);
    const timeDisplay = $derived(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    );

    const {
        dateKey,
        dayNumber,
        playerStatus,
    }: {
        dateKey: string;
        dayNumber: number;
        playerStatus: "ava" | "player";
    } = $props();

    // svelte-ignore state_referenced_locally
    gameManager.init(dateKey, dayNumber, playerStatus);
</script>

<div
    class:game-over={gameManager.gameOver}
    class="game-container text-foreground"
>
    <div class="game-grid">
        <div class="timer edge">
            <div class:urgent={gameManager.secondsLeft <= 30}>
                {timeDisplay}
            </div>
        </div>
        <div class="board">
            <Board />
        </div>
        <div class="words">
            <div class="h-12 p-2">
                {gameManager.currentChain.getString().toUpperCase()}
            </div>

            <ul class="p-2 flex flex-wrap gap-2 overflow-y-scroll">
                {#each gameManager.foundWords.toSorted() as word}
                    <li>
                        {word}
                    </li>
                {/each}
            </ul>
        </div>
        <div
            class="backspace edge z-10 touch-manipulation"
            style={gameManager.gameOver ? "display: none;" : "display: unset;"}
        >
            <button
                onclick={() => gameManager.removeLast()}
                aria-label="backspace"
                class="w-full h-full cursor-pointer z-10"
            >
                <svg
                    id="Layer_2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 148.84 123.7"
                    width="90%"
                    height="90%"
                    ><defs></defs><g id="Layer_1-2"
                        ><path
                            fill="currentColor"
                            class="cls-1"
                            d="M137.46,15.87c-13.45-6.66-27.74-11.43-42.6-13.68-13.46-2.04-29.21-4.32-40.94,4.15-12.62,9.11-24.07,20.29-35.88,30.4C8.01,45.33-3.46,54.51.99,69.34c4.01,13.38,16.83,19.71,28.63,24.99,14.46,6.47,29.23,12.27,44.26,17.29,7.42,2.48,14.89,4.77,22.43,6.87,6.79,1.9,14.63,5.07,21.72,5.22s9.8-5.78,12.31-11.33c2.98-6.6,5.51-13.4,7.55-20.35,4.64-15.79,6.95-32.16,8.74-48.48,1.44-13.12,6.12-31.54-4.85-41.87-5.62-5.29-14.12,3.18-8.49,8.49,3.46,3.26,3.5,7.9,3.32,12.37-.24,6.12-1.06,12.27-1.71,18.36-1.25,11.8-2.8,23.57-5.34,35.16-1.25,5.72-2.74,11.39-4.54,16.96-.9,2.78-1.87,5.53-2.93,8.25s-2.38,7.7-4.39,9.8c-2.25,2.36-.03.52-.02.52-1.08.32-4.35-1.05-5.47-1.33-3.03-.76-6.06-1.54-9.08-2.36-6.34-1.72-12.64-3.57-18.91-5.55-12.23-3.87-24.29-8.24-36.16-13.1-10.27-4.2-23.32-8.22-31.28-16.32-3.04-3.09-5.56-7.73-4.61-12.21,1.17-5.54,7.37-9.52,11.39-12.96,10.17-8.71,20.35-17.42,30.52-26.13,4.93-4.22,9.47-8.47,16.2-9.11s13.81.16,20.41,1.08c14.15,1.96,27.93,6.28,40.73,12.61,6.9,3.41,12.99-6.93,6.06-10.36h0Z"
                        /><path
                            fill="currentColor"
                            class="cls-1"
                            d="M78.49,42.79c8.94,14.36,20.25,26.62,33.64,36.92,2.59,1.99,6.69.38,8.21-2.15,1.84-3.07.4-6.24-2.15-8.21-11.68-8.99-21.55-20.12-29.33-32.62-4.07-6.54-14.46-.52-10.36,6.06h0Z"
                        /><path
                            fill="currentColor"
                            class="cls-1"
                            d="M116.02,35.95c-10.2-.56-20.66,9.41-28,15.58-8.31,6.98-15.57,14.94-22.15,23.56-4.69,6.14,5.73,12.12,10.36,6.06,5.26-6.88,11.25-13.22,17.75-18.95,3.17-2.79,6.45-5.43,9.89-7.88s7.9-6.59,12.15-6.36c7.72.42,7.69-11.58,0-12h0Z"
                        /></g
                    ></svg
                >
            </button>
        </div>
        <div
            class="submit edge z-10 touch-manipulation"
            style={gameManager.gameOver ? "display: none;" : "display: unset;"}
        >
            <button
                class="w-full h-full cursor-pointer z-10"
                aria-label="submit"
                onclick={() => gameManager.submitWord()}
            >
                <svg
                    id="Layer_2"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 162.1 137.09"
                    width="90%"
                    height="90%"
                    ><defs></defs><g id="Layer_1-2"
                        ><path
                            fill="currentColor"
                            class="cls-1"
                            d="M140.25,19.97c-5.83-14.93-21.97-17.96-36.34-18.74-10.11-.55-20.24-.7-30.36-.48-9.44.21-19.22.41-28.35,3.09C28.84,8.64,18.14,21.74,11.59,36.92S-.48,70.09.03,86.87c.53,17.26,9.39,31.8,24.57,40.04,14.27,7.75,31.26,10.12,47.3,10.18,33.32.13,68.84-13.38,83.66-45.25,7.48-16.09,9.15-34.52,1.83-50.98-8-17.97-24.99-29.69-41.04-39.9-6.54-4.15-12.56,6.23-6.06,10.36,12.02,7.64,24.72,15.92,32.65,28.08,7.27,11.15,8.93,24.34,5.54,37.13-7.47,28.18-33.73,44.14-61.34,47.68-13.96,1.79-28.77,1.21-42.41-2.33-12.43-3.23-25.3-9.78-30.28-22.41-5.53-14-1.03-30.25,3.14-43.99,3.75-12.38,8.87-25.8,19.26-34.17,13.5-10.86,34.71-8.85,50.94-8.63,8.41.11,17.19-.07,25.49,1.48,5.65,1.06,13.08,3.02,15.41,8.99,2.78,7.12,14.38,4.02,11.57-3.19h0Z"
                        /><path
                            fill="currentColor"
                            class="cls-1"
                            d="M30.77,77.85c7.6,7.07,15.19,14.14,22.79,21.21,2.54,2.36,7.79,2.49,9.42-1.21,5.61-12.75,11.22-25.5,16.84-38.25,5.1-11.58,9.58-23.87,17.35-33.99,4.7-6.12-5.72-12.1-10.36-6.06-7.77,10.12-12.25,22.41-17.35,33.99-5.61,12.75-11.22,25.5-16.84,38.25l9.42-1.21c-7.6-7.07-15.19-14.14-22.79-21.21-5.65-5.26-14.15,3.21-8.49,8.49h0Z"
                        /></g
                    ></svg
                >
            </button>
        </div>
        <div class="gutter pointer-events-none z-20">
            <Toast />
        </div>
        <div class="banner edge">
            <!-- <img class="h-full w-min p-2" src="Asset 22.svg" alt="" /> -->
            <a href="/">
                <Logo />
            </a>
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
            --rows: 7;
            max-height: unset;
            aspect-ratio: var(--cols) / var(--rows);
            padding: 0;
        }

        .game-container.game-over {
            --rows: 10;
        }

        .game-grid {
            display: grid;
            aspect-ratio: var(--cols) / var(--rows);
            grid-template-columns: repeat(var(--cols), 1fr);
            grid-template-rows: repeat(var(--rows), 1fr);
            transition: grid-template-rows 0.2s;
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
            grid-area: 6 / 1 / 11 / 5;
        }
        .submit {
            grid-area: 7 / 3 / 8 / 4;
        }
        .backspace {
            grid-area: 7 / 4 / 8 / 5;
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

    .timer {
        font-size: 1.5rem;
        font-variant-numeric: tabular-nums;
        font-weight: bold;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
