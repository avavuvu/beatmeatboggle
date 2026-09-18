<script lang="ts">
    import { createGameSession } from "$lib/gameSession";
    import type { ResolvedBoard } from "$lib/board";
    import GameManager from "$lib/GameManager.svelte";
    import InputController from "$lib/InputController.svelte";
    import { onMount, onDestroy } from "svelte"
    import type { PlayerState } from "$lib/constants"
    import { browser } from "$app/environment"
    import { loadGameState } from "$lib/session"
    import Board from "./Board.svelte";
    import Input from "./Input.svelte";
    import Logo from "./Logo.svelte";
    import Reveal from "./Reveal.svelte";
    import Toast from "./Toast.svelte";
    import toaster from "$lib/Toaster.svelte"
    import Definition from "./Definition.svelte"
    import { pause } from "./icons/pause.svelte"
    import { backspace } from "./icons/backspace.svelte"
    import { submit } from "./icons/submit.svelte"
    import Challenge from "./Challenge.svelte"

    const {
        dateKey,
        board,
        playerStatus,
        opponentWords,
        opponentName = "Ava",
        challengedBy = null
    }: {
        dateKey: string;
        board: ResolvedBoard;
        playerStatus: PlayerState;
        opponentWords: string[] | null,
        opponentName?: string,
        challengedBy?: string | null
    } = $props()

    // svelte-ignore state_referenced_locally
    const session = createGameSession(dateKey, playerStatus, board, challengedBy)
    // svelte-ignore state_referenced_locally
    const game = new GameManager(session, opponentWords, opponentName)

    const inputController = new InputController(game)

    const timeDisplay = $derived.by(() => {
        const minutes = Math.floor(game.secondsLeft / 60);
        const seconds = game.secondsLeft % 60;

        if (game.secondsLeft < 60) {
            return String(seconds).padStart(2, "0");
        }

        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    });

    let canAnimate = $state(false)
    let error: null | any = $state()

    let introDelay = 3200
    let hasStartedOnce = false

    const startOrResumeTimer = () => {
        if (!hasStartedOnce) {
            hasStartedOnce = true

            if (loadGameState(session.dateKey)) {
                introDelay = 0
                canAnimate = false
            } else {
                canAnimate = true
            }

            game.gameState = "loading"
            setTimeout(() => {
                game.startGame()
            }, introDelay);
        } else {
            game.resume()
        }
    }

    const attemptAutoResume = () => {
        if (game.gameState === "gameOver" || game.gameState === "paused") return

        startOrResumeTimer()
    }

    const handleVisibilityChange = (event: Event) => {
        if (document.hidden) {
            game.suspend()
        } else {
            attemptAutoResume()
        }
    }

    const toggleTimer = () => {
        if (game.gameState === "playing") {
            game.pause()
        } else if (game.isPaused) {
            startOrResumeTimer()
        }
    }

    onMount(() => {
        // start blurred/suspended until the tab is actually focused
        if (game.gameState !== "gameOver") {
            game.gameState = "backgrounded"
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        if (!document.hidden) {
            attemptAutoResume()
        }
    });

    onDestroy(() => {
        if (browser) {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
        game.stopTimer();
        toaster.showToast = false;
    });
</script>

{#if error}
	<div>
		<h1>An error has occurred</h1>

		<code class="text-red-400">
			{JSON.stringify(error)}
		</code>
	</div>
{/if}

<div
    class:game-over={game.gameState === "gameOver"}
    class="game-container text-foreground"
>
    <div class="game-grid">
        <div
            class:really-urgent={game.secondsLeft <= 10}
            class:urgent={game.secondsLeft < 60}
            class="timer edge"
        >
            <button
                type="button"
                class="timer-button"
                onclick={toggleTimer}
                aria-label={game.gameState === "playing" ? "Pause timer" : "Resume timer"}
            >
                {#if game.gameState === "paused"}
                    <div class="h-16 w-16">
                        {@render pause()}

                    </div>
                {:else}
                    {timeDisplay}
                {/if}
            </button>
        </div>
        <div class="board edge">
            <Board {canAnimate} {game} {inputController} />
        </div>
        <div
            class="words -z-20 pointer-events-none flex flex-col
        "
        >
            <div class="h-12 p-2 shrink-0">
                {game.currentChain.getString().toUpperCase()}
            </div>

            <ul
                class="p-2 flex flex-wrap gap-2 overflow-y-scroll flex-1 min-h-0"
            >
                {#each game.foundWords as word}
                    <li>
                        {word}
                    </li>
                {/each}
            </ul>
        </div>

        <div class="gutter edge -z-10">
            <Toast />
        </div>
        <h1 class="banner block edge">
            <a href="/">
                <span class="sr-only">Play Beat Me at Boggle</span>
                <Logo />
            </a>
        </h1>
        {#if game.gameState === "gameOver"}
            <div class="reveal">
                <Reveal {game} />
            </div>
            <div class="definition edge">
                <Definition/>
            </div>
            <div class="challenge edge">
                <Challenge {game}/>
            </div>
        {/if}
        <div
            class="backspace edge touch-manipulation bg-surface"
            style={game.isPlayingGame ? "display: unset;" : "display: none;" }
        >
            <button
                onclick={() => game.removeLast()}
                aria-label="backspace"
                class="w-full h-full cursor-pointer flex items-center justify-center"
            >
                <div class="w-[90%] h-[90%]">
                    {@render backspace()}
                </div>
            </button>
        </div>
        <div
            class="submit edge touch-manipulation bg-surface"
            style={game.isPlayingGame ? "display: unset;" :  "display: none;"}
        >
            <button
                class="w-full h-full cursor-pointer flex items-center justify-center"
                aria-label="submit"
                onclick={() => game.submitWord()}
            >
                <div class="w-[90%] h-[90%]">
                    {@render submit()}
                </div>
            </button>
        </div>
    </div>
</div>

<Input {inputController} />

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
        overflow: hidden;
    }
    .challenge {
        grid-area: 1 / 2 / 5 / 6;
        z-index: 10;
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
    .definition {
        grid-area: 1 / 1 / 5 / 2;
    }

    /* MOBILE */
    @media (max-width: 600px) {
        .game-container {
            --cols: 4;
            --rows: 7;
            /* height: 100dvh; */

            aspect-ratio: var(--cols) / var(--rows);
            padding: 0;
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

        .game-container.game-over .board {
        	grid-area: 2 / 1 / 4 / 5;
        }

        .game-container.game-over .gutter {
      		display: none;
        }
        .game-container.game-over .reveal {
        	grid-area: 4 / 1 / 8 / 5;
        }
        .game-container.game-over .definition, .game-container.game-over .challenge {
        	grid-area: 2 / 1 / 5 / 5;
            z-index: 10;
        }
        .game-container.game-over .challenge {
        	grid-area: 2 / 1 / 5 / 5;
            z-index: 10;
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

    .timer-button {
        all: unset;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }

    .urgent {
        font-size: 3rem;
    }

    .really-urgent {
        font-size: 3rem;
        color: var(--color-surface);
        background-color: var(--color-foreground);
    }
</style>
