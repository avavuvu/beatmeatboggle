<script lang="ts">
    import Game from "@/Game.svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { redirect } from "@sveltejs/kit";
    import { onMount } from "svelte";

    export const verify = () => {
        const token = browser ? localStorage.getItem("admin_token") : null;
        const isAdmin = !!token;

        if (!isAdmin && browser) {
            redirect(303, "/early");
        }

        return isAdmin;
    };

    let verified = $state(verify());

    let dateKey = $state("");
    let dayNumber = $state(0);

    onMount(() => {
        dateKey = page.url.searchParams.get("date") ?? "";
        dayNumber = new Date(dateKey).getDay();
    });
</script>

{#if verified && dateKey !== ""}
    <Game
        playerStatus="ava"
        scorePromise={Promise.resolve({ avasWords: null, average: 1 })}
        {dateKey}
        {dayNumber}
    />
{:else}
    ...verifying
{/if}
