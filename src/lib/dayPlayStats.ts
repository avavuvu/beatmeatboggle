import type { ScoreCount } from "./statsTypes"

export const MIN_PLAYERS_FOR_DAY_STATS = 50

export type DayPlayStats = {
    players: number
    shares: Record<string, number> | null
    distribution: ScoreCount[] | null
}

const requests = new Map<string, Promise<DayPlayStats | null>>()

export const fetchDayPlayStats = (dateKey: string) => {
    const cached = requests.get(dateKey)
    if (cached) return cached

    const request = fetch(`/api/day-stats?dateKey=${dateKey}`)
        .then((response) =>
            response.ok ? (response.json() as Promise<DayPlayStats>) : null
        )
        .catch(() => null)

    requests.set(dateKey, request)
    request.then((stats) => {
        if (!stats) requests.delete(dateKey)
    })

    return request
}
