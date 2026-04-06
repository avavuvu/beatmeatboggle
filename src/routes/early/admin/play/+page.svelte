<script lang="ts">
    import Game from "@/Game.svelte";
    import type { LayoutProps } from "../$types";

    const { data }: LayoutProps = $props();
</script>

<Game
    playerStatus="ava"
    avasWords={null}
    //@ts-ignore
    dateKey={data.dateKey}
    histogram={{}}
/>
