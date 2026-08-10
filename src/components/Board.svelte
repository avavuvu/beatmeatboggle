<script lang="ts">
    import Tile from "./Tile.svelte";
    import type GameManager from "$lib/GameManager.svelte";
    import type InputController from "$lib/InputController.svelte";

    const { canAnimate, game, inputController }: {
    	canAnimate: boolean
        game: GameManager
        inputController: InputController
    } = $props()

    const shuffledIndices = Array.from(
    	{length: game.session.board.size * game.session.board.size},
     	(_, i) => i
    ).sort(() => Math.random() - 0.5);

    const cells = $derived(game.session.board.letters.map((letter, index) => {
        const [x, y] = [
            index % game.session.board.size,
            Math.floor(index / game.session.board.size),
        ];

        const char = letter.toUpperCase();

        const tileAnimationMs = 200

        const firstAnimationDelay = canAnimate
        	? shuffledIndices[index] * tileAnimationMs
         	: 0

        const secondAnimationDelay = canAnimate
        	? (tileAnimationMs * game.session.board.size * game.session.board.size) + 400 + (x + y) * 100
         	: 0

        return { x, y, char, index, firstAnimationDelay, secondAnimationDelay };
    }));

    const line = $derived(
        [...game.currentChain].map(([key]) => {
            const [x, y] = [
                (key % game.session.board.size) + 0.5,
                Math.floor(key / game.session.board.size) + 0.5,
            ];

            return { x, y };
        }),
    );

    const lineWindows = $derived(
        line.slice(0, -2 + 1).map((_, i) => line.slice(i, i + 2)),
    );

    let svgElement: SVGSVGElement | undefined = $state();

    const getTouchRect = (): DOMRect => {
        return svgElement!.getBoundingClientRect();
    };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<svg
    bind:this={svgElement}
    viewBox="0 0 {game.session.board.size} {game.session.board.size}"
    class:game-over={game.gameState === "gameOver"}
    class:paused={game.isPaused}
    onpointerdown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        inputController.handlePointerDown(e, getTouchRect());
    }}
    onpointermove={(e) => inputController.handlePointerMove(e, getTouchRect())}
    onpointerup={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        inputController.handlePointerUp(e);
    }}
    onpointercancel={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        inputController.handlePointerUp(e);
    }}
>
    {#each cells as { x, y, char, index, firstAnimationDelay, secondAnimationDelay }}
        <!-- svelte-ignore attribute_global_event_reference -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <g
            {x}
            {y}
            transform={`translate(${x}, ${y})`}
            style="--board-delay: {secondAnimationDelay}ms;"
            class:can-animate={canAnimate}
        >
        	<g
			style="--r: {Math.random() * 72 - 36}deg; --tile-delay: {firstAnimationDelay}ms;"
         	>
	            <Tile
	            	{char}
	                selected={game.currentChain.containsKey(index)}
	            />
         	</g>

        </g>
    {/each}

    {#if line.length > 0}
        {@const end = line.at(-1)!}
        <circle class="draw-pointer" cx={end.x} cy={end.y} r="0.1">
        </circle>
    {/if}

    {#each lineWindows as [{ x: x1, y: y1 }, { x: x2, y: y2 }]}
        <line
        	class="draw-line"
            stroke-width="0.002rem"
            {x1}
            {y1}
            {x2}
            {y2}
        >
        </line>
    {/each}
</svg>

<style>
    svg {
        touch-action: none;
        width: 100%;
        height: 100%;

    }

    .draw-pointer {
    	fill: var(--color-accent);
    }

    .draw-line {
    	stroke: var(--color-accent);
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
    	animation: tile-click-in 300ms ease forwards;
     	animation-delay: var(--board-delay);

     	fill: var(--color-surface);
      	stroke: var(--color-foreground);
    }

    :global(.can-animate text) {
           fill: var(--color-foreground);
           animation: text-click-in 300ms ease forwards;
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
     	to {
      		fill: var(--color-board);
        	stroke: var(--color-surface);
      	}
    }

    @keyframes text-click-in {
     	to {
      		fill: var(--color-tile-letter);
      	}
    }

    @keyframes tile-fade-in {
    		0% { opacity: 0; transform: rotate(var(--r));  }
            25%   { opacity: 1; transform: rotate(var(--r));  }
            100% { opacity: 1; transform: rotate(0deg); }
    }

    svg.game-over {
        opacity: 0.4;
        pointer-events: none;
        transition: opacity 0.5s ease;
    }

    svg.paused {
        filter: blur(24px);
        pointer-events: none;
        transition: filter 0.3s ease;
    }
</style>
