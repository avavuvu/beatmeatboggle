import type { PageLoad } from "./$types"
import { toISODateKey } from "$lib/constants"

export const load: PageLoad = async ({ fetch }) => {
    const dateKey = toISODateKey(new Date())
    const res = await fetch(`/api/player-words?dateKey=${dateKey}`)
    const data: {
        avasWords: string[] | null
    } = await res.json()

    return data
}
