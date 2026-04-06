<script lang="ts">
    import Game from "@/Game.svelte";

    const getDateKey = () => {
        const date = new Date();
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    };

    const dateKey = getDateKey();

    const startGame = async (): Promise<{
        avasWords: string[] | null;
        histogram: any;
    }> => {
        const res = await fetch(`/api/player-words?dateKey=${dateKey}`, {
            method: "GET",
        });

        console.log(res);

        const data = await res.json();
        console.log("Stats derived for date:", dateKey, data);

        return data;
    };
</script>

{#await startGame() then { avasWords, histogram }}
    <Game {avasWords} {dateKey} {histogram} playerStatus="player" />
{/await}
