import { redirect } from "@sveltejs/kit"
import { resolvePatronSession } from "$lib/server/patreon"
import type { Handle } from "@sveltejs/kit"

const PATRON_ROUTES = ["/archive", "/practice"]

const GATED_ROUTES: Record<string, string> = {
    "/archive/[date]": "/archive?kickback",
    "/practice/play": "/practice?kickback",
}

export const handle: Handle = async ({ event, resolve }) => {
    const id = event.route.id ?? ""

    event.locals.patron = null

    if (PATRON_ROUTES.some((prefix) => id.startsWith(prefix))) {
        event.locals.patron = await resolvePatronSession(event.cookies)
    }

    const kickback = GATED_ROUTES[id]

    if (kickback && event.locals.patron?.tier !== "paid") {
        redirect(303, kickback)
    }

    return resolve(event)
}
