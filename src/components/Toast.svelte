<script lang="ts">
    import toastManager, { type Toast } from "$lib/ToastManager.svelte";
    import { fade } from "svelte/transition";

    let latestToast: Toast | undefined = $state();
    let showToast = $state(false);

    let timeOut: ReturnType<typeof setTimeout>;

    $effect(() => {
        latestToast = toastManager.toasts.at(-1);
        showToast = true;

        clearTimeout(timeOut);

        timeOut = setTimeout(() => {
            showToast = false;
        }, 3000);
    });
</script>

{#if showToast && latestToast}
    {@const { content, type } = latestToast}
    <div
        class:word={type === "word"}
        class:error={type === "error"}
        transition:fade={{ duration: 100 }}
        class="w-full h-full bg-surface border border-border text-foreground"
    >
        <h1 class="text-center">
            {content[0]}
        </h1>
        {#each content.slice(1) as line}
            <p>
                {line}
            </p>
        {/each}
    </div>
{/if}

<style>
    .word > h1 {
        font-size: xx-large;
    }

    .error {
        background-color: gray;
    }

    .error > h1,
    .error > p {
        color: brown;
    }
</style>
