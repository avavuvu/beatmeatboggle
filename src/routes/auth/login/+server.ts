import { redirect } from "@sveltejs/kit"
import {
    PUBLIC_PATREON_CLIENT_ID,
    PUBLIC_PATREON_REDIRECT_URI,
} from "$env/static/public"
import type { RequestEvent } from "@sveltejs/kit"

export const GET = ({ cookies }: RequestEvent) => {
    const state = crypto.randomUUID()
    cookies.set("oauth_state", state, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 600,
    })

    const params = new URLSearchParams({
        response_type: "code",
        client_id: PUBLIC_PATREON_CLIENT_ID,
        redirect_uri: PUBLIC_PATREON_REDIRECT_URI,
        scope: "identity",
        state,
    })

    redirect(303, `https://www.patreon.com/oauth2/authorize?${params}`)
}
