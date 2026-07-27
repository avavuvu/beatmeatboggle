<script lang="ts">
    import Head from "@/styling/Head.svelte"
    import Game from "@/Game.svelte"
    import { page } from "$app/state"
    import { onMount } from "svelte"
    import { decodeChallenge } from "$lib/challenge/challengeToken"
    import favicon from "$lib/assets/favicon.svg"

    type ChallengeSession = {
        date: Date
        opponentWords: string[] | null
        opponentName: string
        totalWords: string[] | null
        challengedBy: string
    }

    let challengeState: "loading" | "lander" | "playing" | "error" = $state("lander")

    let data: ChallengeSession | undefined = $state()

    const token = page.url.searchParams.get("token")
    const challengeData = decodeChallenge(token || "")

    onMount(async () => {
        if (!token) {
            challengeState = "error"
            return
        }

        const response = await fetch(`/api/challenge?token=${encodeURIComponent(token)}`)

        if (!response.ok) {
            challengeState = "error"
            return
        }

        const json = await response.json()

        data = {
            date: new Date(`${json.date}T00:00:00Z`),
            opponentWords: json.opponentWords,
            opponentName: json.opponentName,
            totalWords: json.totalWords,
            challengedBy: json.challengedBy,
        }
        challengeState = "lander"

    })
</script>

<Head title="You've been challenged! — Beat Me at Boggle" />

{#if data && challengeState === "playing"}
	<Game
        date={data.date}
        playerStatus="player"
        opponentWords={data.opponentWords}
        opponentName={data.opponentName}
        totalWords={data.totalWords}
        challengedBy={data.challengedBy}
    />
{:else}
    <div class="px-4  mt-44  flex justify-center items-center flex-col text-foreground">
        {#if !data && challengeState !== "error"}
            <img src="{favicon}" alt="" class="animate-spin w-4 h-4" />
        {:else}
            <div class="h-4"></div>
        {/if}
        <a href="/" class="font-bold">Beat Me at Boggle</a>
        <main class="mx-automax-w-96 px-4 p-8 text-center  border">
            {#if challengeState === "loading"}
                Loading challenge...
            {:else if challengeState === "lander"}
                <div>
                    You've been challenged by <span class="font-bold">{challengeData?.name ? `${challengeData.name}` : ""}</span> to a game of Boggle...
                </div>

                <br/>

                <div>
                    <button
                        disabled={!data}
                        class="border mx-auto px-2 py-1 hover:bg-surface bg-foreground text-surface hover:text-foreground transition-all cursor-pointer disabled:opacity-45"
                        onclick={() => challengeState = "playing"}>
                            I accept the challenge
                        </button>
                </div>

            {:else if challengeState === "error"}
                <div>
                    An error has occured when loading the challenge.
                </div>
                    <br/>
                    <a href="/" class="link underline">Return Home</a>
            {/if}
        </main>

    </div>
{/if}
