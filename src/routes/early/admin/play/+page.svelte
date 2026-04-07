<script lang="ts">
    import Game from "@/Game.svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { redirect } from "@sveltejs/kit";

    export const verify = () => {
        const token = browser ? localStorage.getItem("admin_token") : null;
        const isAdmin = !!token;

        if (!isAdmin && browser) {
            redirect(303, "/early");
        }

        return isAdmin;
    };

    let verified = $state(verify());

    const dateKey = page.url.searchParams.get("date") ?? "";
    const dayNumber = new Date(dateKey).getDay();
</script>

{#if verified}
    <Game
        playerStatus="ava"
        scorePromise={Promise.resolve({ avasWords: null, average: 1 })}
        {dateKey}
        {dayNumber}
    />
{:else}
    ...verifying
{/if}
