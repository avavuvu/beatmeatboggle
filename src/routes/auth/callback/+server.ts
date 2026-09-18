import { redirect } from "@sveltejs/kit"
import { setPatronCookie } from "$lib/server/session"
import { buildPatronSession, exchangeCode, fetchIdentity } from "$lib/server/patreon"
import type { RequestEvent } from "@sveltejs/kit"

export const GET = async ({ url, cookies }: RequestEvent) => {
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const storedState = cookies.get("oauth_state")

    cookies.delete("oauth_state", { path: "/" })

    if (!code || !state || state !== storedState)
        redirect(303, "/archive?error=state")

    let tokens
    try {
        tokens = await exchangeCode(code)
    } catch (e) {
        console.error(e)
        redirect(303, "/archive?error=token")
    }

    const identity = await fetchIdentity(tokens.accessToken)

    setPatronCookie(cookies, buildPatronSession(identity, tokens))

    redirect(303, "/archive")
}
