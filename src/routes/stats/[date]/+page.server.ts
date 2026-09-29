import type { PageServerLoad } from "./$types"
import { error } from "@sveltejs/kit"
import { isValidDateKey } from "$lib/dates"
import { getGameDateKey } from "$lib/server/gameDate"
import { getDayStats } from "$lib/server/stats"

export const load: PageServerLoad = async ({ params }) => {
    const dateKey = params.date

    if (!isValidDateKey(dateKey) || dateKey >= getGameDateKey()) {
        error(404, "No stats found for this date")
    }

    const stats = await getDayStats(dateKey)

    if (!stats) {
        error(404, "No stats found for this date")
    }

    return stats
}
