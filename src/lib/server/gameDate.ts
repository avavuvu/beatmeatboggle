import { toISODateKey } from "../constants"

// the game day rolls over at 00:00 utc+10, so shift before taking the utc date
export const getGameDateKey = (now: Date = new Date()): string =>
    toISODateKey(new Date(now.getTime() + 10 * 60 * 60 * 1000))
