import { redirect } from "@sveltejs/kit"
import { dev } from "$app/environment"
import {
    PUBLIC_PATREON_CLIENT_ID,
    PUBLIC_PATREON_REDIRECT_URI,
} from "$env/static/public"
import { PATREON_CLIENT_SECRET, PATREON_CAMPAIGN_ID } from "$env/static/private"
import { createSession } from "$lib/session"
import type { PatronSession, PatronTier } from "$lib/session"
import type { RequestEvent } from "@sveltejs/kit"

export const GET = async ({ url, cookies }: RequestEvent) => {
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const storedState = cookies.get("oauth_state")

    cookies.delete("oauth_state", { path: "/" })

    if (!code || !state || state !== storedState)
        redirect(303, "/archive?error=state")

    const tokenRes = await fetch("https://www.patreon.com/api/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "BeatMeAtBoggle",
        },
        body: new URLSearchParams({
            code,
            grant_type: "authorization_code",
            client_id: PUBLIC_PATREON_CLIENT_ID,
            client_secret: PATREON_CLIENT_SECRET,
            redirect_uri: PUBLIC_PATREON_REDIRECT_URI,
        }),
    })

    if (!tokenRes.ok) {
        const err = await tokenRes.text()
        console.error("Patreon token exchange failed:", tokenRes.status, err)
        redirect(303, "/archive?error=token")
    }

    const { access_token } = await tokenRes.json()

    const identityParams = new URLSearchParams({
        include: "memberships",
        "fields[member]": "patron_status,currently_entitled_amount_cents",
        "fields[user]": "full_name,thumb_url",
    })
    const identityRes = await fetch(
        `https://www.patreon.com/api/oauth2/v2/identity?${identityParams}`,
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "User-Agent": "BeatMeAtBoggle",
            },
        }
    )

    const { data, included } = await identityRes.json()

    type MemberInclude = {
        type: string
        attributes?: {
            patron_status: string | null
            currently_entitled_amount_cents: number
        }
        relationships?: { campaign?: { data?: { id: string } } }
    }

    console.log(data.relationships.memberships, JSON.stringify((data)))

    const member = (included ?? []).find(
        (m: MemberInclude) =>
            m.type === "member" &&
            m.relationships?.campaign?.data?.id === PATREON_CAMPAIGN_ID
    ) as MemberInclude | undefined



    let tier: PatronTier = "free"
    if (member?.attributes?.patron_status === "active_patron") {
        tier = "paid"
    }

    // if (data.id === "19662370") {
    //     tier = "paid"
    // }

    const session: PatronSession = {
        patreonUserId: data.id,
        tier,
        fullName: data.attributes?.full_name ?? null,
        thumbUrl: data.attributes?.thumb_url ?? null,
    }

    cookies.set("patron_session", createSession(session), {
        path: "/",
        httpOnly: true,
        secure: !dev,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
    })

    console.log(session)

    redirect(303, "/archive")
}
