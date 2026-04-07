<script lang="ts">
    import Game from "@/Game.svelte";
    import { browser } from "$app/environment";
    import { redirect } from "@sveltejs/kit";
    import type { LayoutProps } from "../../../$types";

    const { data }: LayoutProps = $props();

    export const verify = () => {
        const token = browser ? localStorage.getItem("admin_token") : null;
        const isAdmin = !!token;

        if (!isAdmin && browser) {
            redirect(303, "/early");
        }

        return isAdmin;
    };

    let verified = $state(verify());

    //@ts-ignore
    // svelte-ignore state_referenced_locally
    const dateKey = data.dateKey;
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
