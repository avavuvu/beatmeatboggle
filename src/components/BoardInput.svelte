<script lang="ts">
    let {
        size,
        letters = $bindable(),
        class: className = "",
    }: {
        size: number
        letters: string[]
        class?: string
    } = $props()

    const uid = $props.id()

    const inputId = (index: number) => `${uid}-tile-${index}`

    const focusTile = (index: number) => {
        if (index < 0 || index >= size * size) return

        const input = document.getElementById(inputId(index)) as HTMLInputElement | null
        input?.focus()
        input?.select()
    }

    const oninput = (index: number) => (event: Event) => {
        const input = event.currentTarget as HTMLInputElement
        const letter = input.value.toLowerCase().replace(/[^a-z]/g, "").slice(-1)

        letters[index] = letter
        input.value = letter

        if (letter) {
            focusTile(index + 1)
        }
    }

    const onkeydown = (index: number) => (event: KeyboardEvent) => {
        switch (event.key) {
            case "Backspace":
                if (letters[index] === "") {
                    event.preventDefault()
                    focusTile(index - 1)
                }
                break
            case "ArrowLeft":
                event.preventDefault()
                focusTile(index - 1)
                break
            case "ArrowRight":
                event.preventDefault()
                focusTile(index + 1)
                break
            case "ArrowUp":
                event.preventDefault()
                focusTile(index - size)
                break
            case "ArrowDown":
                event.preventDefault()
                focusTile(index + size)
                break
        }
    }
</script>

<div
    class="grid {className}"
    style:grid-template-rows="repeat({size}, 1fr)"
    style:grid-template-columns="repeat({size}, 1fr)"
>
    {#each { length: size * size }, i}
        <div class="tile aspect-square min-w-0 border border-surface bg-board focus-within:bg-muted transition-colors">
            <label
                for={inputId(i)}
                class="w-full h-full min-h-0 text-center text-tile-letter inline-flex justify-center items-center"
            >
                <input
                    id={inputId(i)}
                    size="1"
                    class="uppercase bg-transparent text-center focus:outline-none"
                    type="text"
                    inputmode="text"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    maxlength="1"
                    value={letters[i]}
                    oninput={oninput(i)}
                    onkeydown={onkeydown(i)}
                    onfocus={(event) => event.currentTarget.select()}
                />
                {#if letters[i] === "q"}
                    <span>u</span>
                {/if}
            </label>
        </div>
    {/each}
</div>
