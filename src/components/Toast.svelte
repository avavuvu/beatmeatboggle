<script lang="ts">
    import toaster, { type Toast } from "$lib/Toaster.svelte";
    import { fade } from "svelte/transition";

    let latestToast: Toast | undefined = $state();

    let timeOut: ReturnType<typeof setTimeout>;

    $effect(() => {
        latestToast = toaster.toasts.at(-1);
        toaster.showToast = true;

        clearTimeout(timeOut);

        timeOut = setTimeout(() => {
            toaster.showToast = false;
        }, 3000);
    });
</script>

{#if toaster.showToast && latestToast}
    {@const { content, type } = latestToast}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        onclick={() => (toaster.showToast = false)}
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
        background-color: var(--color-foreground);
        color: var(--color-surface);
        font-size: large;
    }
</style>
