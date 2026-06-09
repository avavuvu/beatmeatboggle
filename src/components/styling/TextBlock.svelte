<script lang="ts">
    import type { Snippet } from "svelte"

    const { children, title }: {
        children: Snippet,
        title: string,
    } = $props()
</script>

<svelte:head>
    <title>{title} — Beat Me at Boggle</title>
</svelte:head>


<div class="text-foreground max-w-3xl my-10 mx-auto px-4">
    <span class="inline-flex gap-4 w-full">
        <h1 class="px-2 font-bold">{title}</h1>
        <a href="/" class="underline">Return Home</a>
    </span>
    <main class="border p-4 *:py-1">
        {@render children()}
    </main>
</div>



<style>
    main :global(a) {
        text-decoration: underline;
    }

    main :global(thead) {
        font-weight: bold;
    }

    main :global(th),
    main :global(td) {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
    }
</style>
