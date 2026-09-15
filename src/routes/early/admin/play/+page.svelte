<script lang="ts">
    import Game from "@/Game.svelte";
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { redirect } from "@sveltejs/kit";
    import { onMount } from "svelte";
    import type { ResolvedBoard } from "$lib/board"

    export const verify = () => {
        const token = browser ? localStorage.getItem("admin_token") : null;
        const isAdmin = !!token;

        if (!isAdmin && browser) {
            redirect(303, "/early");
        }

        return isAdmin;
    };

    let verified = $state(verify());

    let dateKey: string | undefined = $state()
    let board: ResolvedBoard | undefined = $state()
    let error: string | undefined = $state()

    onMount(async () => {
        dateKey = page.url.searchParams.get("date") ?? undefined

        if (!dateKey) {
            error = "missing ?date=YYYY-MM-DD"
            return
        }

        const response = await fetch(`/api/board?dateKey=${dateKey}`, {
            headers: { authorization: localStorage.getItem("admin_token") ?? "" },
        })

        if (!response.ok) {
            error = `board request failed: ${response.status}`
            return
        }

        board = await response.json()
    });
</script>

{#if error}
    {error}
{:else if verified && dateKey && board}
    <Game playerStatus="ava" {dateKey} {board} opponentWords={null} />
{:else}
    ...verifying
{/if}
