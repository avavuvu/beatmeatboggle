<script lang="ts">
    const {
        word,
        selected,
        onclick,
        inverted = false,
    }: {
        word: string
        selected: boolean
        onclick: () => void
        inverted?: boolean
    } = $props()
</script>

<button
    class="inline-flex overflow-hidden cursor-pointer"
    class:selected
    class:inverted
    {onclick}
>
    <span
        class="whitespace-nowrap overflow-hidden max-w-0 transition-all duration-200"
        class:max-w-0={!selected}
        style={selected ? `max-width: calc(${word.length}ch + 6rem)` : ""}
    >
        define "
    </span>
    <span>{word}</span>
    <span class:max-w-0={!selected}>"</span>
</button>

<style>
    button {
        interpolate-size: allow-keywords;
        transition: all 200ms ease;
    }

    .selected {
        text-decoration: underline;
        background-color: var(--color-foreground);
        color: var(--color-surface);
    }

    .selected.inverted {
        background-color: var(--color-surface);
        color: var(--color-foreground);
    }
</style>
