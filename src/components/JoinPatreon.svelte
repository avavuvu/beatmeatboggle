<script lang="ts">
    import { invalidateAll } from "$app/navigation"
    import { onMount } from "svelte"

    const { tier }: { tier: string | null } = $props()

    let checking = $state(false)
    let opened = $state(false)

    const recheck = async () => {
        if (checking || !tier) return
        checking = true

        const response = await fetch("/auth/refresh", { method: "POST" })
        const { tier: newTier } = await response.json()

        if (newTier !== tier) {
            await invalidateAll()
        }

        checking = false
    }

    onMount(() => {
        const onVisible = () => {
            if (opened && document.visibilityState === "visible") {
                opened = false
                recheck()
            }
        }

        document.addEventListener("visibilitychange", onVisible)
        return () => document.removeEventListener("visibilitychange", onVisible)
    })
</script>

<a
    class="underline"
    href="https://www.patreon.com/2722716/join"
    target="_blank"
    rel="noopener"
    onclick={() => (opened = true)}
>
    Join on Patreon
</a>
{#if tier}
    <span class="text-muted">
        (<button type="button" class="underline cursor-pointer" onclick={recheck} disabled={checking}>
            {checking ? "checking..." : "already subscribed?"}
        </button>)
    </span>
{/if}
