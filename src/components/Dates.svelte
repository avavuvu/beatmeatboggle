<script lang="ts">
    const { dates, paid, pastGames }: {
        dates: string[],
        paid: boolean,
        pastGames: Record<string, boolean>
    } = $props()

    const monthMap: Record<string, string> = {
        "01": "January",
        "02": "February",
        "03": "March",
        "04": "April",
        "05": "May",
        "06": "June",
        "07": "July",
        "08": "August",
        "09": "September",
        "10": "October",
        "11": "November",
        "12": "December",
    } as const

    type Month = typeof monthMap[keyof typeof monthMap]

    // svelte-ignore state_referenced_locally
    const months: Partial<Record<Month,string[][]>> = Object.groupBy(
        dates.map(date => date.split("-")),
        (date) => {
            // 0 year
            // 1 month
            // 2 day
            const month = monthMap[date[1] as keyof typeof monthMap]
            return month
        }

    )

</script>

<div class="flex flex-wrap gap-2 justify-center">
    {#each Object.entries(months) as [month, dates]}
        {@const [fy, fm] = (dates ?? [])[0]?.map(Number) ?? [0, 0]}
        {@const firstDayOffset = (new Date(fy, fm - 1, 1).getDay() + 6) % 7}
        <div class="w-xs border p-2">
            <h3 class="w-full border-b mb-1">{month}</h3>
            <div class="grid grid-cols-7 font-bold">
                {#each ['MON','TUE','WED','THU','FRI','SAT','SUN'] as day}
                    <span>{day}</span>
                {/each}
            </div>
            <ul class="grid grid-cols-7">
                {#each dates ?? [] as date}
                    {@const isoKey = date.join("-")}
                    {@const [year, month, day] = date.map(Number)}
                    {@const col = (new Date(year, month - 1, day).getDay() + 6) % 7 + 1}
                    {@const row = Math.ceil((day + firstDayOffset) / 7)}
                    <li
                        style:grid-column-start={col} style:grid-row-start={row}>
                        <svelte:element
                            href="/archive/{isoKey}"
                            this={paid ? "a" : "span"} >

                            {#if pastGames[isoKey] !== undefined}
                                {@const hasFinishedGame = pastGames[isoKey]}
                                {#if hasFinishedGame}
                                    ☑️
                                {:else}
                                    ⏰
                                {/if}
                            {:else}
                                {date[2]}
                            {/if}
                        </svelte:element>
                    </li>
                {/each}
            </ul>
        </div>
    {/each}

</div>
