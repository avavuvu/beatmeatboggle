<script lang="ts">
    import type { ScoreManagerInitData } from "$lib/ScoreManager.svelte";
    import Game from "@/Game.svelte";

    const getDateKey = () => {
        const date = new Date();
        return {
            dateKey: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`,
            dayNumber: date.getDay(),
        };
    };

    const { dateKey, dayNumber } = getDateKey();

    const startGame = async (): Promise<ScoreManagerInitData> => {
        const res = await fetch(`/api/player-words?dateKey=${dateKey}`, {
            method: "GET",
        });

        return res.json();
    };

    const scorePromise = startGame();
</script>

<Game {dateKey} {dayNumber} playerStatus="player" {scorePromise} />
