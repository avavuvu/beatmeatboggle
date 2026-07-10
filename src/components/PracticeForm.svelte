<script lang="ts">
    import { goto } from '$app/navigation'

    type PracticeFormData = {
        size: 4 | 5,
        time: number,
        dice: "classic" | "clusters" | "custom",
    }

    let preset: | "weekday" | "weekend" | "edited" = $state("weekday")

    const WEEKDAY_PRESET: PracticeFormData = {
        size: 4,
        time: 3,
        dice: "clusters",

    }

    const WEEKEND_PRESET: PracticeFormData = {
        size: 4,
        time: 4,
        dice: "clusters",
    }

    let formData: PracticeFormData = $state({
        size: 4,
        time: 3,
        dice: "clusters",
    })

    let customBoard = $state(Array.from({length: 25}, () => "a"))

    const submit = (e: SubmitEvent) => {
        e.preventDefault()
        const params = new URLSearchParams({
            size: String(formData.size),
            time: String(formData.time),
            dice: formData.dice,
        })
        if (formData.dice === 'custom') {
            const letters = customBoard
                .slice(0, formData.size * formData.size)
                .map((letter) => letter || 'a')
            params.set('override', letters.join(''))
        } else {
            const seed = Date.now()
            params.set("seed", seed.toString())
        }



        goto(`/practice/play?${params}`)
    }
</script>

<form class="max-w-lg mx-auto gap-8" onsubmit={submit}>
    <!-- Preset -->
    <h2>Preset</h2>
    <div class="radio mb-6">
        <input type="radio" id="weekday" name="preset" value="weekday"
            bind:group={preset}
            oninput={() => formData = JSON.parse(JSON.stringify(WEEKDAY_PRESET))}>
        <label for="weekday">Weekday</label>
        <input type="radio" id="weekend" name="preset" value="weekend"
            bind:group={preset}
            oninput={() => formData = JSON.parse(JSON.stringify(WEEKEND_PRESET))}>
        <label for="weekend">Weekend</label>
        <input type="radio" id="edited" name="preset" value="edited"
            bind:group={preset}
            oninput={() => formData = JSON.parse(JSON.stringify(WEEKEND_PRESET))}>
        <label for="edited">Custom</label>
    </div>

    {#if preset === "edited"}
    <div class="mb-6">
        <!-- Time -->
        <h2>Time</h2>
        <div class="mb-6 flex justify-center flex-col items-center text-center">
            <input class="max-w-96" type="range" name="time" id="time" min="1" max="10" bind:value={formData.time}>
            <div>
                {formData.time} minute{formData.time === 1 ? "" : "s"}
            </div>
        </div>

        <h2>Board</h2>
        <div class="grid grid-cols-2">

            <!-- Size -->
            <div>
                <h3>Size</h3>
                <div class="radio mb-6" >
                    <input type="radio" id="4x4" name="size" value="{4}" bind:group={formData.size}>
                    <label for="4x4">4x4</label>
                    <input type="radio" id="5x5" name="size" value="{5}" bind:group={formData.size}>
                    <label for="5x5">5x5</label>
                </div>
            </div>

            <!-- Dice -->
            <div>
                <h3>Dice</h3>
                <div class="radio mb-6" >
                    <input type="radio" id="classic" name="dice" value="classic" bind:group={formData.dice}>
                    <label for="classic">Classic</label>
                    <input type="radio" id="clusters" name="dice" value="clusters" bind:group={formData.dice}>
                    <label for="clusters">Clusters</label>
                    <input type="radio" id="custom" name="dice" value="custom" bind:group={formData.dice}>
                    <label for="custom">Custom</label>
                </div>
            </div>
        </div>

        <!-- Custom Board -->
        {#if formData.dice === "custom"}
        <div class="grid gap-1 h-48 mb-6 "
            style:grid-template-rows="repeat({formData.size}, 1fr)"
            style:grid-template-columns="repeat({formData.size}, 1fr)">

            {#each {length: formData.size * formData.size}, i}
                <div class="w-full border p-0.5 bg-foreground text-surface">
                    <input
                        class="w-full h-full text-center font-bold uppercase"
                        type="text"
                        maxlength="1"
                        bind:value={customBoard[i]}
                        onclick={() => customBoard[i] = ""}/>
                </div>
            {/each}
        </div>
        {:else}
            <section class="h-48 italic mb-6">
                {#if formData.dice === "classic"}
                    <p>Uses simulated dice for combinations that could appear on a real board</p>
                {:else}
                    <p>Uses a letter-clustering algorithm that attempts to make fun boards</p>
                {/if}
            </section>
        {/if}
    </div>
    {/if}

    <div class="flex justify-center">
        <input class="underline text-center " type="submit" value="Play!">

    </div>
</form>


<style>
h2, h3 {
    font-weight: bold;
    text-align: center;
}

form .radio {
    display: grid;
    grid-template-columns: 1em auto;
    gap: 0.5em;
    line-height: 1.1;
    justify-content: center;
}

input[type="range"] {
  accent-color: var(--color-foreground);
}

input[type="radio"] {
  -webkit-appearance: none;
  appearance: none;

  margin: 0;

  font: inherit;
  color: currentColor;
  width: 1.15em;
  height: 1.15em;
  border: 0.15em solid currentColor;
  border-radius: 50%;
  transform: translateY(-0.075em);

  display: grid;
  place-content: center;
}

input[type="radio"]::before {
  content: "";
  width: 0.65em;
  height: 0.65em;
  border-radius: 50%;
  transform: scale(0);
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1em 1em var(--color-foreground);
  /* Windows High Contrast Mode */
  background-color: CanvasText;
}

input[type="radio"]:checked::before {
  transform: scale(1);
}

input[type="radio"]:focus {
  outline: max(1px, 0.05em) solid currentColor;
  outline-offset: max(1px, 0.05em);
}
</style>
