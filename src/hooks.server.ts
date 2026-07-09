import { redirect } from "@sveltejs/kit"
import { parseSession } from "$lib/session"
import type { AdminSession, PatronSession } from "$lib/session"
import type { Handle } from "@sveltejs/kit"

export const handle: Handle = async ({ event, resolve }) => {
    const id = event.route.id

    if (id?.startsWith("/early/admin")) {
        const session = parseSession<AdminSession>(
            event.cookies.get("admin_session")
        )
        if (!session?.admin) redirect(303, "/early")
    }

    if ((id as string | null) === "/archive/[date]") {
        const session = parseSession<PatronSession>(
            event.cookies.get("patron_session")
        )
        if (session?.tier !== "paid") redirect(303, "/archive?kickback")
    }

    return resolve(event)
}
