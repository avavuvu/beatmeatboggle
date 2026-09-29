import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { getPreviousGameDateKey } from "$lib/server/gameDate"
import { getDayStats, PUBLIC_STATS_HEADERS } from "$lib/server/stats"

export const load: PageServerLoad = async ({ setHeaders }) => {
    const stats = await getDayStats(getPreviousGameDateKey())

    if (!stats) {
        error(404, "No stats found for yesterday")
    }

    setHeaders(PUBLIC_STATS_HEADERS)

    return stats
}
