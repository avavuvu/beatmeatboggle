<script lang="ts">
    import TextBlock from "@/styling/TextBlock.svelte"
    import Head from "@/styling/Head.svelte"

    let { error } = $props();
</script>


<Head title={error.message} />

<TextBlock title={error.message}>

    <details>
        <code>{JSON.stringify(error)}</code>
        <summary>
            <span>ERROR:</span> <span class="text-muted">An error has occurred</span>
        </summary>
    </details>
</TextBlock>
