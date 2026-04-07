import gameManager from "./GameManager.svelte";

const PROXIMITY_THRESHOLD = 0.38;
const MIN_MOVE_PX = 3;

class InputManager {
    isSliding = $state(false);

    #lastActivatedIndex: number = -1;
    #lastPointerClientX: number = 0;
    #lastPointerClientY: number = 0;

    #startPointerClientX: number = 0;
    #startPointerClientY: number = 0;
    #hasMoved: boolean = false;

    #toSvgCoords = (
        clientX: number,
        clientY: number,
        rect: DOMRect
    ): [number, number] => {
        const svgX = ((clientX - rect.left) / rect.width) * gameManager.gridSize;
        const svgY = ((clientY - rect.top) / rect.height) * gameManager.gridSize;
        return [svgX, svgY];
    };

    #tileAtPoint = (svgX: number, svgY: number): number => {
        let bestIndex = -1;
        let bestDist = PROXIMITY_THRESHOLD;

        for (let i = 0; i < gameManager.gridSize * gameManager.gridSize; i++) {
            const cx = (i % gameManager.gridSize) + 0.5;
            const cy = Math.floor(i / gameManager.gridSize) + 0.5;
            const dist = Math.hypot(svgX - cx, svgY - cy);
            if (dist < bestDist) {
                bestDist = dist;
                bestIndex = i;
            }
        }

        return bestIndex;
    };

    inputKey = (event: KeyboardEvent) => {
        if (gameManager.gameOver) return;
        switch (event.key) {
            case "Backspace":
                gameManager.removeLast();
                break;
            case "Enter":
                gameManager.submitWord();
                break;
            default:
                if (event.key.match(/^[a-zA-Z]$/)) {
                    gameManager.inputChar(event.key.toLowerCase());
                }
                break;
        }
    };

    handlePointerDown = (event: PointerEvent, rect: DOMRect) => {
        if (gameManager.gameOver) return;
        // Only accept primary button (left click) or touch
        if (event.button !== 0 && event.pointerType === "mouse") return;
        event.preventDefault();

        this.isSliding = true;
        this.#hasMoved = false;
        this.#lastActivatedIndex = -1;

        this.#startPointerClientX = event.clientX;
        this.#startPointerClientY = event.clientY;
        this.#lastPointerClientX = event.clientX;
        this.#lastPointerClientY = event.clientY;

        const [svgX, svgY] = this.#toSvgCoords(event.clientX, event.clientY, rect);
        const index = this.#tileAtPoint(svgX, svgY);

        if (index !== -1) {
            this.#lastActivatedIndex = index;
            gameManager.addTile(index);
        }
    };

    handlePointerMove = (event: PointerEvent, rect: DOMRect) => {
        if (gameManager.gameOver) return;
        if (!this.isSliding) return;
        event.preventDefault();

        const totalDist = Math.hypot(
            event.clientX - this.#startPointerClientX,
            event.clientY - this.#startPointerClientY
        );

        if (totalDist > MIN_MOVE_PX) {
            this.#hasMoved = true;
        }

        const dx = event.clientX - this.#lastPointerClientX;
        const dy = event.clientY - this.#lastPointerClientY;
        const movedPx = Math.hypot(dx, dy);

        if (movedPx < MIN_MOVE_PX) return;

        const [svgX, svgY] = this.#toSvgCoords(event.clientX, event.clientY, rect);
        const index = this.#tileAtPoint(svgX, svgY);

        if (index !== -1 && index !== this.#lastActivatedIndex) {
            this.#lastActivatedIndex = index;
            this.#lastPointerClientX = event.clientX;
            this.#lastPointerClientY = event.clientY;
            gameManager.addTile(index);
        }
    };

    handlePointerUp = (event: PointerEvent) => {
        if (!this.isSliding) return;
        event.preventDefault();

        this.isSliding = false;
        this.#lastActivatedIndex = -1;

        if (this.#hasMoved) {
            gameManager.submitWord();
        }
    };
}

const inputManager = new InputManager();
export default inputManager;