<script lang="ts">
    import { onDestroy } from "svelte"
    import type GameSession from "$lib/GameSession.svelte"
    import { camera } from "./icons/camera.svelte"

    const { session }: { session: GameSession } = $props()

    let message = $state("")
    let imageFile: File | null = $state(null)
    let previewUrl: string | null = $state(null)
    let fileInput: HTMLInputElement

    let submitting = $state(false)
    let submitted = $state(false)

    const handleFileChange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0] ?? null
        imageFile = file

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        previewUrl = file ? URL.createObjectURL(file) : null
    }

    onDestroy(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
    })

    const submit = async (e: SubmitEvent) => {
        e.preventDefault()
        submitting = true

        await session.submitAva(message, imageFile)

        submitting = false
        submitted = true
    }
</script>

<form onsubmit={submit} class="grid grid-cols-3 gap-1 py-2">
    <button
        type="button"
        class="p-2 w-20 h-20 cursor-pointer"
        onclick={() => fileInput.click()}
        aria-label="Add a photo"
    >
        {#if previewUrl}
            <img
                src={previewUrl}
                alt="Selected"
                class="w-full h-full object-cover rounded-full"
            />
        {:else}
            {@render camera()}
        {/if}
    </button>

    <input
        bind:this={fileInput}
        type="file"
        accept="image/*"
        class="hidden"
        onchange={handleFileChange}
    />

    <textarea
        bind:value={message}
        placeholder="Today's boggle was:"
        maxlength="500"
        rows="3"
        class="border p-2 bg-foreground text-surface w-full col-span-2 resize-none "
    ></textarea>

    <button
        type="submit"
        disabled={submitting || submitted}
        class="underline cursor-pointer disabled:opacity-50"
    >
        {#if submitted}
            Sent!
        {:else if submitting}
            Sending...
        {:else}
            Send
        {/if}
    </button>
</form>
