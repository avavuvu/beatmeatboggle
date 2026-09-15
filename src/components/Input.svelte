<script lang="ts">
    import type InputController from "$lib/InputController.svelte";

    const { inputController }: { inputController: InputController } = $props()

    const onkeydown = (event: KeyboardEvent) => {
        inputController.inputKey(event)
    }
</script>

<svelte:window {onkeydown}/>
