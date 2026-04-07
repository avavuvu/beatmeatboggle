<script lang="ts">
    import type { ScoreManagerInitData } from "$lib/ScoreManager.svelte";
    import Game from "@/Game.svelte";

    const date = new Date();

    const dateFormatted = date.toLocaleDateString("en-AU", {
        month: "long",
        day: "2-digit",
        year: "numeric",
    });

    const getDateKey = () => {
        return {
            dateKey: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`,
            dayNumber: date.getDay(),
        };
    };

    const { dateKey, dayNumber } = getDateKey();
</script>

<svelte:head>
    <title>{dateFormatted} — Beat Me at Boggle</title>
</svelte:head>

<Game {dateKey} {dayNumber} playerStatus="player" />
