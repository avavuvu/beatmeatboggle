import { redirect } from "@sveltejs/kit"
import { parseSession } from "$lib/server/session"
import type { PatronSession } from "$lib/server/session"
import type { Handle } from "@sveltejs/kit"

export const handle: Handle = async ({ event, resolve }) => {
    const id = event.route.id

    if ((id as string | null) === "/archive/[date]") {
        const session = parseSession<PatronSession>(
            event.cookies.get("patron_session")
        )
        if (session?.tier !== "paid") redirect(303, "/archive?kickback")
    }

    if ((id as string | null) === "/practice/play") {
        const session = parseSession<PatronSession>(
            event.cookies.get("patron_session")
        )
        if (session?.tier !== "paid") redirect(303, "/practice?kickback")
    }

    return resolve(event)
}
