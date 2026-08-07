<script lang="ts">
    import Checker from "@/checker/Checker.svelte"
    import type { PageData } from "../$types"
    import Head from "@/styling/Head.svelte"

    const { data }: { data: PageData } = $props()

    const word = data.word.toUpperCase()
</script>

<Head
    title="Is {word} a valid word in Boggle?"
    description="Check if {word} can be played in Boggle or Scrabble. Use this tool to verify if {word} is a Boggle word."
    />

<Checker preloaded={data.word}/>
