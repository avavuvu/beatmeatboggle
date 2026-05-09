<script lang="ts">
    import Toggle from "@/settings/Toggle.svelte";
    import settingsManager, {
        type SettingKey,
    } from "$lib/SettingsManager.svelte"

    const entries = $derived(
        Object.entries(settingsManager.settings) as [
            SettingKey,
            (typeof settingsManager.settings)[SettingKey],
        ][],
    );
</script>

<svelte:head>
    <title>Settings — Beat Me at Boggle</title>
</svelte:head>

<div class="text-foreground max-w-4xl my-10 mx-auto px-4">
    <span class="inline-flex gap-4 w-full">
        <h1 class="px-2 font-bold">Settings</h1>
        <a href="/" class="underline">Return Home</a>
    </span>

    <main class="border p-4">
        <ul class="max-w-lg mx-auto flex flex-col gap-8">
            {#each entries as [key, setting] (key)}
                <li>
                    <Toggle
                        heading={setting.heading}
                        optionOff={setting.optionOff}
                        optionOn={setting.optionOn}
                        description={setting.description}
                        bind:checked={settingsManager.settings[key].value}
                    />
                </li>
            {/each}
        </ul>
    </main>
</div>
