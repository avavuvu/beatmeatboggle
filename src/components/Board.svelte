<script lang="ts">
    import Tile from "./Tile.svelte";
    import gameManager from "$lib/GameManager.svelte";
    import inputManager from "$lib/InputManager.svelte";


    const { canAnimate }: {
    	canAnimate: boolean
    } = $props()

    const shuffledIndices = Array.from(
    	{length: gameManager.gridSize * gameManager.gridSize},
     	(_, i) => i
    ).sort(() => Math.random() - 0.5);

    const cells = $derived(gameManager.letters.map((letter, index) => {
        const [x, y] = [
            index % gameManager.gridSize,
            Math.floor(index / gameManager.gridSize),
        ];

        const char = letter.toUpperCase();

        const tileAnimationMs = 200

        const firstAnimationDelay = canAnimate
        	? shuffledIndices[index] * tileAnimationMs
         	: 0

        const secondAnimationDelay = canAnimate
        	? (tileAnimationMs * gameManager.gridSize * gameManager.gridSize) + 400 + (x + y) * 100
         	: 0

        return { x, y, char, index, firstAnimationDelay, secondAnimationDelay };
    }));

    const line = $derived(
        [...gameManager.currentChain].map(([key]) => {
            const [x, y] = [
                (key % gameManager.gridSize) + 0.5,
                Math.floor(key / gameManager.gridSize) + 0.5,
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
    viewBox="0 0 {gameManager.gridSize} {gameManager.gridSize}"
    class:game-over={gameManager.gameState === "gameOver"}
    onpointerdown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        inputManager.handlePointerDown(e, getTouchRect());
    }}
    onpointermove={(e) => inputManager.handlePointerMove(e, getTouchRect())}
    onpointerup={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        inputManager.handlePointerUp(e);
    }}
    onpointercancel={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        inputManager.handlePointerUp(e);
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
	                selected={gameManager.currentChain.containsKey(index)}
	            />
         	</g>

        </g>
    {/each}

    {#if line.length > 0}
        {@const end = line.at(-1)!}
        <circle cx={end.x} cy={end.y} r="0.1" fill="var(--color-accent)">
        </circle>
    {/if}

    {#each lineWindows as [{ x: x1, y: y1 }, { x: x2, y: y2 }]}
        <line
            stroke="var(--color-accent)"
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
</style>
