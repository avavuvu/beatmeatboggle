<script lang="ts">
    import Tile from "./Tile.svelte"
    import type GameManager from "$lib/GameManager.svelte"
    import type InputController from "$lib/InputController.svelte"

    const {
        canAnimate,
        game,
        inputController,
        highlightPath = null,
    }: {
        canAnimate: boolean
        game: GameManager
        inputController: InputController
        highlightPath?: number[] | null
    } = $props()

    const chainPath = $derived([...game.currentChain].map(([key]) => key))

    const activePath = $derived(highlightPath ?? chainPath)

    const toCell = (position: number) => ({
        x: position % game.session.board.size,
        y: Math.floor(position / game.session.board.size),
    })

    const shuffledIndices = Array.from(
        { length: game.session.board.size * game.session.board.size },
        (_, i) => i
    ).sort(() => Math.random() - 0.5)

    const cells = $derived(
        game.session.board.letters.map((letter, index) => {
            const [x, y] = [
                index % game.session.board.size,
                Math.floor(index / game.session.board.size),
            ]

            const char = letter.toUpperCase()

            const tileAnimationMs = 200

            const firstAnimationDelay = canAnimate
                ? shuffledIndices[index] * tileAnimationMs
                : 0

            const secondAnimationDelay = canAnimate
                ? tileAnimationMs *
                      game.session.board.size *
                      game.session.board.size +
                  400 +
                  (x + y) * 100
                : 0

            return {
                x,
                y,
                char,
                index,
                firstAnimationDelay,
                secondAnimationDelay,
            }
        })
    )

    const line = $derived(
        activePath.map((position) => {
            const { x, y } = toCell(position)
            return { x: x + 0.5, y: y + 0.5 }
        })
    )

    const lineWindows = $derived(
        line.slice(0, -1).map((_, start) => line.slice(start, start + 2))
    )

    let svgElement: SVGSVGElement | undefined = $state()

    const getTouchRect = (): DOMRect => {
        return svgElement!.getBoundingClientRect()
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
    bind:this={svgElement}
    viewBox="0 0 {game.session.board.size} {game.session.board.size}"
    class:game-over={game.gameState === "gameOver"}
    class:showing-path={highlightPath !== null}
    class:paused={game.isPaused}
    onpointerdown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        inputController.handlePointerDown(e, getTouchRect())
    }}
    onpointermove={(e) => inputController.handlePointerMove(e, getTouchRect())}
    onpointerup={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
        inputController.handlePointerUp(e)
    }}
    onpointercancel={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
        inputController.handlePointerUp(e)
    }}
>
    {#each cells as { x, y, char, index, firstAnimationDelay, secondAnimationDelay }}
        <!-- svelte-ignore attribute_global_event_reference -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <g
            transform={`translate(${x}, ${y})`}
            style="--board-delay: {secondAnimationDelay}ms;"
            class:can-animate={canAnimate}
        >
            <g
                style="--r: {Math.random() * 72 -
                    36}deg; --tile-delay: {firstAnimationDelay}ms;"
            >
                <Tile {char} selected={chainPath.includes(index)} />
            </g>
        </g>
    {/each}

    {#key highlightPath}
        {#each highlightPath ?? [] as position, order}
            {@const { x, y } = toCell(position)}
            <g transform={`translate(${x}, ${y})`}>
                <g class="path-tile" style="--order: {order};">
                    <Tile
                        char={game.session.board.letters[
                            position
                        ].toUpperCase()}
                        selected
                    />
                </g>
            </g>
        {/each}

        {#if line.length > 0}
            {@const end = line.at(-1)!}
            <circle
                class="draw-pointer"
                class:fade-in={highlightPath !== null}
                style="--order: {line.length - 1};"
                cx={end.x}
                cy={end.y}
                r="0.1"
            >
            </circle>
        {/if}

        {#each lineWindows as [{ x: x1, y: y1 }, { x: x2, y: y2 }], segment}
            <line
                class="draw-line"
                class:drawing={highlightPath !== null}
                style="--order: {segment};"
                pathLength="1"
                stroke-width="0.002rem"
                {x1}
                {y1}
                {x2}
                {y2}
            >
            </line>
        {/each}
    {/key}
</svg>

<style>
    svg {
        --path-step: 75ms;
        touch-action: none;
        width: 100%;
        height: 100%;
    }

    .draw-pointer {
        fill: var(--color-foreground);
    }

    .draw-line {
        stroke: var(--color-foreground);
    }

    .fade-in,
    .path-tile {
        animation: path-fade-in var(--path-step) linear backwards;
        animation-delay: calc(var(--path-step) * var(--order));
    }

    .drawing {
        stroke-dasharray: 1;
        animation: path-draw var(--path-step) linear backwards;
        animation-delay: calc(var(--path-step) * var(--order));
    }

    @keyframes path-fade-in {
        from {
            opacity: 0;
        }
    }

    @keyframes path-draw {
        from {
            stroke-dashoffset: 1;
        }
    }

    line {
        pointer-events: none;
    }

    g {
        cursor: pointer;
        user-select: none;
        touch-action: none;
    }

    :global(.can-animate rect) {
        animation: tile-click-in 300ms ease backwards;
        animation-delay: var(--board-delay);
    }

    :global(.can-animate text) {
        animation: text-click-in 300ms ease backwards;
        animation-delay: var(--board-delay);
    }

    g.can-animate > g {
        opacity: 0;
        animation: tile-fade-in 350ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        transform-origin: center;
        transform-box: fill-box;
        animation-delay: var(--tile-delay);
    }

    @keyframes tile-click-in {
        from {
            fill: var(--color-surface);
            stroke: var(--color-foreground);
        }
    }

    @keyframes text-click-in {
        from {
            fill: var(--color-foreground);
        }
    }

    @keyframes tile-fade-in {
        0% {
            opacity: 0;
            transform: rotate(var(--r));
        }
        25% {
            opacity: 1;
            transform: rotate(var(--r));
        }
        100% {
            opacity: 1;
            transform: rotate(0deg);
        }
    }

    svg.game-over {
        opacity: 0.4;
        pointer-events: none;
        transition: opacity 0.5s ease;
    }

    svg.game-over.showing-path {
        opacity: 1;
    }

    svg.paused {
        filter: blur(24px);
        pointer-events: none;
        transition: filter 0.3s ease;
    }
</style>
