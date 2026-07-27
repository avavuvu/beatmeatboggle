<script lang="ts">
    import { page } from "$app/state"
    import { challengeManager } from "$lib/challenge/challenge.svelte";
    import { decodeChallenge, encodeChallenge } from "$lib/challenge/challengeToken"
    import type GameManager from "$lib/GameManager.svelte"

    const { game }: { game: GameManager } = $props()

    let name = $state("")

    let id = $derived(encodeChallenge({
        date: game.session.dateKey,
        playerId: game.session.playerId || "",
        name
    }))

    let shareButtonText = $state("Share")

    const onsubmit = async (event: SubmitEvent) => {
        event.preventDefault()

        const shareLink = `${page.url.origin}/challenge?token=${id}`
        const shareText = `${name} wants to challenge you at Boggle!\n${shareLink}`
        const shareData = {
            title: "Beat Me At Boggle",
            text: shareText
        }

        if (navigator.canShare?.(shareData)) {
            await navigator.share(shareData)
        } else {
            await navigator.clipboard.writeText(shareText)
            shareButtonText = "Copied to Clipboard"
        }
    }

</script>

{#if challengeManager.showChallenge}
    <div class="bg-surface border-border w-full h-full overflow-y-scroll flex flex-col justify-between">
        <form class="p-2" {onsubmit}>
           	<h2 class="font-bold">Challenge</h2>
            <div class="bubble-container flex gap-1 flex-col [align-items:end]">
                <div class="imessage-bubble w-48">
                    <!-- svelte-ignore a11y_autofocus -->
                    <input
                        class="bg-surface text-foreground p-0.5 w-24"
                        autofocus
                        placeholder="your name"
                        required
                        type="text"
                        bind:value={name}/> wants to challenge you at Boggle!
                    <div class="bubble-tail"></div>
                </div>
                <div class="imessage-bubble">
                    <button class="underline cursor-pointer" type="submit">
                        {shareButtonText}
                    </button>
                    <div class="bubble-tail"></div>
                </div>
            </div>
        </form>

        <code class="break-all">
        {id}


        {JSON.stringify(decodeChallenge(id))}
        </code>

        <div class="w-full  bg-foreground text-surface  px-2 text-right">
        </div>
    </div>
{/if}
