import gameManager from "./GameManager.svelte";

const PROXIMITY_THRESHOLD = 0.38;
const MIN_MOVE_PX = 3;

class InputManager {
    isSliding = $state(false);

    #lastActivatedIndex: number = -1;
    #lastTouchClientX: number = 0;
    #lastTouchClientY: number = 0;

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

    handleTileClick = (index: number) => {
        if (gameManager.gameOver) return;
        if (this.isSliding) return;
        gameManager.addTile(index);
    };

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

    handleTouchStart = (event: TouchEvent, rect: DOMRect) => {
        if (gameManager.gameOver) return;
        event.preventDefault();
        this.isSliding = true;
        this.#lastActivatedIndex = -1;

        const touch = event.touches[0];
        this.#lastTouchClientX = touch.clientX;
        this.#lastTouchClientY = touch.clientY;

        const [svgX, svgY] = this.#toSvgCoords(touch.clientX, touch.clientY, rect);
        const index = this.#tileAtPoint(svgX, svgY);

        if (index !== -1) {
            this.#lastActivatedIndex = index;
            gameManager.addTile(index);
        }
    };

    handleTouchMove = (event: TouchEvent, rect: DOMRect) => {
        if (gameManager.gameOver) return;
        event.preventDefault();
        if (!this.isSliding) return;

        const touch = event.touches[0];

        const dx = touch.clientX - this.#lastTouchClientX;
        const dy = touch.clientY - this.#lastTouchClientY;
        const movedPx = Math.hypot(dx, dy);
        if (movedPx < MIN_MOVE_PX) return;

        const [svgX, svgY] = this.#toSvgCoords(touch.clientX, touch.clientY, rect);
        const index = this.#tileAtPoint(svgX, svgY);

        if (index !== -1 && index !== this.#lastActivatedIndex) {
            this.#lastActivatedIndex = index;
            this.#lastTouchClientX = touch.clientX;
            this.#lastTouchClientY = touch.clientY;
            gameManager.addTile(index);
        }
    };

    handleTouchEnd = (event: TouchEvent) => {
        event.preventDefault();
        this.isSliding = false;
        this.#lastActivatedIndex = -1;
        gameManager.submitWord()
    };
}

const inputManager = new InputManager();
export default inputManager;