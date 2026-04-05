<script lang="ts">
    const {
        char,
        x,
        y,
        selected,
    }: {
        char: string;
        x: number;
        y: number;
        selected: boolean;
    } = $props();
</script>

<rect class:selected stroke-width=".02px" width={1} height={1}> </rect>
<text
    pointer-events="none"
    font-size="0.05em"
    x="0.5"
    y="0.79"
    text-anchor="middle"
    // font-weight="bold"
>
    {char}
</text>

<style>
    rect {
        fill: var(--color-foreground);
        stroke: var(--color-surface);
        transform: fill;
        transition-duration: 100ms;
    }

    rect:hover {
        fill: var(--color-muted);
    }

    rect.selected {
        fill: var(--color-muted);
    }

    text {
        pointer-events: none;
        user-select: none;
        fill: var(--color-surface);
        font-family: var(--default-font-family);
    }
</style>
