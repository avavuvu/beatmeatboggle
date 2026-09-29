import { dateFromKey } from "./constants"

export const isValidDateKey = (dateKey: string): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
        return false
    }

    const date = dateFromKey(dateKey)
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(dateKey)
}

export const formatDateKey = (dateKey: string): string =>
    dateFromKey(dateKey).toLocaleDateString("en-AU", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    })
