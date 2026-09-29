<script lang="ts">
    import type { ResolvedBoard } from "$lib/board"

    let date = $state(new Date().toISOString().slice(0, 10));

    let board: ResolvedBoard | null = $state(null)
    let error: string | null = $state(null)
    let busy = $state(false)

    const reroll = async () => {
        busy = true
        error = null

        const response = await fetch("/api/board/reroll", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: localStorage.getItem("admin_token") ?? "",
            },
            body: JSON.stringify({ dateKey: date }),
        })

        const body = await response.json()

        if (response.ok) {
            board = body
        } else {
            error = body.error ?? `request failed: ${response.status}`
        }

        busy = false
    }
</script>

<main class="mx-auto mt-48 w-96 p-8 border text-center text-foreground">
    <div>
        <input
            class="border p-2 text-center bg-foreground text-surface"
            type="date"
            bind:value={date}
            oninput={() => { board = null; error = null }}
        />

        <ul class="text-left underline">
            <li>
                <a href="/early/admin/play?date={date}">play</a>
            </li>
            <li>
                <button type="button" class="underline cursor-pointer" onclick={reroll} disabled={busy}>
                    {busy ? "rerolling..." : "reroll"}
                </button>
            </li>
        </ul>

        {#if error}
            <p class="text-red-400 mt-4">{error}</p>
        {/if}

        {#if board}
            <div class="mt-4">
                <div
                    class="grid gap-1 mx-auto w-48 font-bold uppercase"
                    style:grid-template-columns="repeat({board.size}, 1fr)"
                >
                    {#each board.letters as letter}
                        <span class="border aspect-square flex items-center justify-center">{letter}</span>
                    {/each}
                </div>
                <p class="mt-2">{board.totalWords.length} words</p>
            </div>
        {/if}
    </div>
</main>
