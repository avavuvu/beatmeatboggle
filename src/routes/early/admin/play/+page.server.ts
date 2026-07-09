import type { RequestEvent } from "@sveltejs/kit"

export const load = ({ url }: RequestEvent) => {
    return {
        dateStr:
            url.searchParams.get("date") ??
            new Date().toISOString().slice(0, 10),
    }
}
