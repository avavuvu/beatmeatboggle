<script lang="ts">
    import { page } from "$app/state"
    import { challengeManager } from "$lib/challenge/challenge.svelte"
    import { encodeChallenge } from "$lib/challenge/challengeToken"
    import type GameManager from "$lib/GameManager.svelte"
    import { onDestroy, onMount } from "svelte"
    import { wipeDown } from "$lib/transitions"

    const { game }: { game: GameManager } = $props()

    const FEEDBACK_MS = 2000

    let name = $state("")
    let nameInput: HTMLInputElement | undefined = $state()
    let canShare = $state(false)
    let feedback = $state<string | null>(null)
    let feedbackTimer: ReturnType<typeof setTimeout> | undefined

    const shareLink = $derived(
        `${page.url.origin}/challenge?token=${encodeChallenge({
            date: game.session.dateKey,
            playerId: game.session.playerId || "",
            name: name.trim(),
        })}`
    )

    const hasName = $derived(name.trim().length > 0)

    const message = $derived(
        `${name.trim()} has challenged you to a game of Boggle!`
    )

    const buttonText = $derived.by(() => {
        if (feedback) return feedback
        if (!hasName) return "Add your name"
        return canShare ? "Send challenge" : "Copy link"
    })

    const focusName = () => nameInput?.focus()

    const showFeedback = (text: string) => {
        feedback = text
        clearTimeout(feedbackTimer)
        feedbackTimer = setTimeout(() => (feedback = null), FEEDBACK_MS)
    }

    const clearFeedback = () => {
        clearTimeout(feedbackTimer)
        feedback = null
    }

    onMount(() => {
        canShare = typeof navigator.share === "function"

        const savedName = localStorage.getItem("playerName")
        if (savedName) {
            name = savedName
        } else {
            nameInput?.focus()
        }
    })

    onDestroy(() => clearTimeout(feedbackTimer))

    const onsubmit = async (event: SubmitEvent) => {
        event.preventDefault()

        if (!hasName) {
            focusName()
            return
        }

        localStorage.setItem("playerName", name.trim())

        const shareData = {
            title: "Beat Me at Boggle",
            text: `${message}\n${shareLink}`,
        }

        try {
            if (navigator.canShare?.(shareData)) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(shareData.text)
                showFeedback("Copied!")
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return
            }
            showFeedback("Couldn't share, try again")
        }
    }
</script>

<div
    in:wipeDown
    class="bg-surface w-full h-full overflow-y-auto flex flex-col p-2"
>
    <div class="flex justify-between items-baseline">
        <h2 class="font-bold">Challenge a friend</h2>
        <button
            class="underline cursor-pointer"
            type="button"
            onclick={() => (challengeManager.showChallenge = false)}
        >
            Close
        </button>
    </div>

    <form class="flex-1 flex flex-col justify-center gap-6 py-4" {onsubmit}>
        <label class="flex flex-col gap-1">
            <input
                bind:this={nameInput}
                bind:value={name}
                oninput={clearFeedback}
                class="border border-border bg-surface text-foreground px-2 py-1"
                autocomplete="nickname"
                placeholder="Your name"
                type="text"
            />
        </label>

        <div class="flex flex-col gap-1">
            <div class="bubble-container flex flex-col [align-items:end]">
                <div class="imessage-bubble min-w-0">
                    {#if hasName}
                        {name} has challenged<br />you to a game of Boggle
                    {:else}
                        <button
                            type="button"
                            class="blank cursor-pointer"
                            onclick={focusName}
                        >
                            your name
                        </button>
                        has challenged<br />you to a game of Boggle
                    {/if}

                    <div class="bubble-tail"></div>
                </div>
            </div>
        </div>

        <button
            type="submit"
            aria-disabled={!hasName}
            class="self-end border px-3 py-1 bg-foreground text-surface transition-all cursor-pointer"
            class:opacity-45={!hasName}
            class:hover:bg-surface={hasName}
            class:hover:text-foreground={hasName}
        >
            {buttonText}
        </button>
    </form>
</div>

<style>
    .blank {
        padding: 0 0.25rem;
        border: 1px dashed var(--color-surface);
        font-style: italic;
    }
</style>
