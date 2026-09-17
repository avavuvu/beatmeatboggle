import { resolvePatronSession } from "$lib/server/patreon"
import type { RequestEvent } from "@sveltejs/kit"

export const POST = async ({ cookies }: RequestEvent) => {
    const session = await resolvePatronSession(cookies, true)

    return Response.json({ tier: session?.tier ?? null })
}
