<script lang="ts">
    import Game from "@/Game.svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { redirect } from "@sveltejs/kit";
    import { onMount } from "svelte";
    import { toISODateKey } from "$lib/constants"

    export const verify = () => {
        const token = browser ? localStorage.getItem("admin_token") : null;
        const isAdmin = !!token;

        if (!isAdmin && browser) {
            redirect(303, "/early");
        }

        return isAdmin;
    };

    let verified = $state(verify());

    let date: Date | undefined = $state()

    onMount(() => {
        date = new Date(page.url.searchParams.get("date")!);
    });
</script>

{#if verified && date}
    <Game playerStatus="ava" {date} avasWords={null}  />
{:else}
    ...verifying
{/if}
