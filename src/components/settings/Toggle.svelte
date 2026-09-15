<script lang="ts">
    let {
        heading,
        optionOff,
        optionOn,
        description,
        checked = $bindable(false),
        compact = false,
    }: {
        heading: string;
        optionOff?: string;
        optionOn: string;
        description?: string;
        checked?: boolean;
        compact?: boolean;
    } = $props();

    const id = $derived(heading.toLowerCase());
</script>

{#if !compact}
<h2 class="font-bold">{heading}</h2>
{/if}

{#if description}
    <p class="italic">{description}</p>
{/if}

<div
    class:compact
    class="setting gap-2 grid items-center h-12 mb-2 text-center"
>
    {#if !compact}
        <label class="option-off cursor-pointer" for={id}>
            {optionOff}
        </label>
    {/if}
    <label class="switch">
        <input type="checkbox" {id} bind:checked />
        <span class="slider"></span>
    </label>
    <label class="option-on cursor-pointer" for={id}>
        {optionOn}
    </label>
</div>

<style>
    .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--color-surface);
        -webkit-transition: 0.4s;
        transition: 0.4s;
        border: 1px solid var(--color-border);
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 3px;
        bottom: 3px;
        background-color: var(--color-foreground);
        -webkit-transition: 0.4s;
        transition: 0.4s;
    }

    .setting {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
    }

    .setting.compact {
        display: flex;
        grid-template-columns: unset;
    }


    .setting:has(input:checked) .option-on {
        text-decoration: underline;
    }

    .setting:has(input:not(:checked)) .option-off {
        text-decoration: underline;
    }

    input:checked + .slider {
        background-color: var(--color-foreground);
    }

    input:checked + .slider:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
        background-color: var(--color-surface);
    }
</style>
