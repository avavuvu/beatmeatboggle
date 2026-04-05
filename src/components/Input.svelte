<script lang="ts">
    import inputManager from "$lib/InputManager.svelte";

    const onkeydown = (event: KeyboardEvent) => {
        event.preventDefault()
        inputManager.inputKey(event)
    }
</script>

<svelte:window {onkeydown}/>