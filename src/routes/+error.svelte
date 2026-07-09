<script lang="ts">
    import TextBlock from "@/styling/TextBlock.svelte"

    let { error } = $props();
</script>


<TextBlock title={error.message}>

    <details>
        <code>{JSON.stringify(error)}</code>
        <summary>
            <span>ERROR:</span> <span class="text-muted">An error has occured</span>
        </summary>
    </details>
</TextBlock>
