import type { PageLoad } from "./$types"
import { loadDirtyWords } from "$lib/dictionary/load"

export const load: PageLoad = async ({ data, fetch }) => {
    await loadDirtyWords(fetch)

    return data
}
