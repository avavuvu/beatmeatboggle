import type { RequestEvent } from "@sveltejs/kit"

export const load = async ({ locals, url }: RequestEvent) => {
    const error = url.searchParams.get("error")
    const tier = locals.patron?.tier ?? null
    const fullName = locals.patron?.fullName ?? null
    const thumbUrl = locals.patron?.thumbUrl ?? null

    return {
        tier,
        fullName,
        thumbUrl,
        error,
    }
}
