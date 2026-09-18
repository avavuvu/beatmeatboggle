import { fetchMembers } from "$lib/server/patreon"
import type { PageServerLoad } from "./$types"

const CACHE_FOR = 60 * 60 * 1000

let cached: { members: Record<number, string[]>; at: number } | null = null

export const load: PageServerLoad = async () => {
    if (!cached || Date.now() - cached.at > CACHE_FOR) {
        try {
            cached = { members: await fetchMembers(), at: Date.now() }
        } catch (e) {
            console.error(e)
            cached ??= { members: {}, at: 0 }
        }
    }

    return { members: cached.members }
}
