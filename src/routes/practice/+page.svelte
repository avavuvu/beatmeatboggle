<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import type { PatronTier } from "$lib/session"
    import PracticeForm from "@/PracticeForm.svelte"
    import { page } from "$app/state";

    const { data }: {
        data: {
            tier: PatronTier | null
            fullName: string | null
            thumbUrl: string | null
            error: string | null
        }
    } = $props()

    const kickback = $derived(page.url.searchParams.get("kickback") !== null)
</script>

<Head title="Practice — Beat Me At Boggle" description="Play unlimited Boggle" />

<div class="text-foreground max-w-4xl my-10 mx-auto px-4">
    <span class="inline-flex justify-between gap-[2ch] w-full">
        <span class="inline-flex gap-[2ch] flex-wrap">
            <h1 class="px-2 font-bold">Practice</h1>
            <a href="/" class="underline">Return Home</a>
        </span>

        {#if !data.tier}
            <a class="underline" href="/auth/login">Sign in</a>
        {:else}
            <form method="POST" action="/auth/logout">
                <button type="submit" class="underline cursor-pointer">Sign Out</button>
            </form>
        {/if}
    </span>

    <main class="border p-4">
        {#if data.fullName}
            <div class="pb-4 flex justify-between gap-[2ch] h-24">
                <p class="font-bold">Hi {data.fullName}!</p>
                {#if data.thumbUrl}
                    <img class="border p-2" src={data.thumbUrl} alt="{data.fullName}'s profile picture" />
                {/if}
            </div>
        {/if}

        <div class="py-4">
            {#if kickback}
                <p class="text-red-400">You must subscribe to play practice games.</p>
                <p>
                    <a class="underline" href="https://www.patreon.com/2722716/join" target="_blank" rel="noopener">Join on Patreon</a>
                </p>
            {:else}
                {#if data.tier === 'free'}
                    <p>You're connected but not yet a member.</p>
                    <a class="underline" href="https://www.patreon.com/2722716/join" target="_blank" rel="noopener">Join on Patreon</a>
                    <span> to access past puzzles.</span>
                {:else}
                    <p>Past puzzles are available to Patreon supporters.</p>
                    <a class="underline" href="/auth/login">Connect with Patreon</a>
                {/if}
            {/if}


        </div>

        <div style:opacity={data.tier !== 'paid' ? 0.5 : 1}>
            <PracticeForm/>
        </div>
    </main>
</div>
