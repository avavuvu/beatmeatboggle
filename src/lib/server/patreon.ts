import {
    PUBLIC_PATREON_CLIENT_ID,
    PUBLIC_PATREON_REDIRECT_URI,
    PUBLIC_PATREON_CAMPAIGN_ID,
} from "$env/static/public"
import { PATREON_CLIENT_SECRET, PATREON_CREATOR_TOKEN } from "$env/static/private"
import type { Cookies } from "@sveltejs/kit"
import {
    PATRON_COOKIE,
    clearPatronCookie,
    readPatronCookie,
    setPatronCookie,
    type PatronSession,
    type PatronTier,
} from "./session"

export const RECHECK_AFTER: Record<PatronTier, number> = {
    free: 3 * 60 * 1000,
    paid: 24 * 60 * 60 * 1000,
}

const AVA_PATREON_USER_ID = "19662370"

const TOKEN_URL = "https://www.patreon.com/api/oauth2/token"
const IDENTITY_URL = "https://www.patreon.com/api/oauth2/v2/identity"
const USER_AGENT = "BeatMeAtBoggle"

export type PatreonTokens = {
    accessToken: string
    refreshToken: string
}

export type PatreonIdentity = {
    patreonUserId: string
    tier: PatronTier
    fullName: string | null
    thumbUrl: string | null
}

class PatreonAuthError extends Error {}

const requestTokens = async (body: Record<string, string>): Promise<PatreonTokens> => {
    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({
            ...body,
            client_id: PUBLIC_PATREON_CLIENT_ID,
            client_secret: PATREON_CLIENT_SECRET,
        }),
    })

    if (!response.ok) {
        throw new PatreonAuthError(
            `patreon token request failed: ${response.status} ${await response.text()}`
        )
    }

    const { access_token, refresh_token } = await response.json()

    return { accessToken: access_token, refreshToken: refresh_token }
}

export const exchangeCode = (code: string) =>
    requestTokens({
        code,
        grant_type: "authorization_code",
        redirect_uri: PUBLIC_PATREON_REDIRECT_URI,
    })

export const refreshTokens = (refreshToken: string) =>
    requestTokens({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    })

export const fetchIdentity = async (accessToken: string): Promise<PatreonIdentity> => {
    const params = new URLSearchParams({
        include: "memberships,memberships.campaign",
        "fields[member]": "patron_status,currently_entitled_amount_cents",
        "fields[user]": "full_name,thumb_url",
    })

    const response = await fetch(`${IDENTITY_URL}?${params}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": USER_AGENT,
        },
    })

    if (response.status === 401) {
        throw new PatreonAuthError("patreon access token rejected")
    }

    if (!response.ok) {
        throw new Error(`patreon identity request failed: ${response.status}`)
    }

    const { data, included } = await response.json()

    type MemberInclude = {
        type: string
        attributes?: {
            patron_status: string | null
            currently_entitled_amount_cents: number
        }
        relationships?: { campaign?: { data?: { id: string } } }
    }

    const member = (included ?? []).find(
        (m: MemberInclude) =>
            m.type === "member" &&
            m.relationships?.campaign?.data?.id === PUBLIC_PATREON_CAMPAIGN_ID
    ) as MemberInclude | undefined

    const isPaid =
        member?.attributes?.patron_status === "active_patron" &&
        (member.attributes.currently_entitled_amount_cents ?? 0) > 0

    console.log(data, included)

    return {
        patreonUserId: data.id,
        tier: isPaid || data.id === AVA_PATREON_USER_ID ? "paid" : "free",
        fullName: data.attributes?.full_name ?? null,
        thumbUrl: data.attributes?.thumb_url ?? null,
    }
}

export const buildPatronSession = (
    identity: PatreonIdentity,
    tokens: PatreonTokens
): PatronSession => ({
    ...identity,
    ...tokens,
    checkedAt: Date.now(),
})

const isStale = (session: PatronSession) =>
    Date.now() - session.checkedAt > RECHECK_AFTER[session.tier]

const recheck = async (session: PatronSession): Promise<PatronSession | null> => {
    let tokens: PatreonTokens = {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
    }

    try {
        try {
            return buildPatronSession(await fetchIdentity(tokens.accessToken), tokens)
        } catch (e) {
            if (!(e instanceof PatreonAuthError)) throw e

            tokens = await refreshTokens(tokens.refreshToken)
            return buildPatronSession(await fetchIdentity(tokens.accessToken), tokens)
        }
    } catch (e) {
        if (e instanceof PatreonAuthError) {
            return null
        }

        console.error("patreon recheck failed, keeping previous session", e)
        return session
    }
}

export const resolvePatronSession = async (
    cookies: Cookies,
    force = false
): Promise<PatronSession | null> => {
    const session = readPatronCookie(cookies)

    if (!session) {
        if (cookies.get(PATRON_COOKIE)) clearPatronCookie(cookies)
        return null
    }

    if (!force && !isStale(session)) {
        return session
    }

    const fresh = await recheck(session)

    if (!fresh) {
        clearPatronCookie(cookies)
        return null
    }

    if (fresh !== session) {
        setPatronCookie(cookies, fresh)
    }

    return fresh
}

type MemberResponse = {
    data: {
        attributes: {
            full_name: string
            patron_status: string | null
            currently_entitled_amount_cents: number
        }
    }[]
    meta: { pagination: { cursors?: { next: string | null } } }
}

export const fetchMembers = async (): Promise<Record<number, string[]>> => {
    const members: Array<{ name: string, cents: number}> = []
    let cursor: string | null = null

    do {
        const params = new URLSearchParams({
            "fields[member]": "full_name,patron_status,currently_entitled_amount_cents",
            "page[size]": "100",
        })

        if (cursor) {
            params.set("page[cursor]", cursor)
        }

        const response = await fetch(
            `https://www.patreon.com/api/oauth2/v2/campaigns/${PUBLIC_PATREON_CAMPAIGN_ID}/members?${params}`,
            {
                headers: {
                    Authorization: `Bearer ${PATREON_CREATOR_TOKEN}`,
                    "User-Agent": USER_AGENT,
                },
            }
        )

        if (!response.ok) {
            throw new Error(`patreon members request failed: ${response.status}`)
        }

        const { data, meta }: MemberResponse = await response.json()

        for (const { attributes } of data) {
            if (
                attributes.patron_status === "active_patron"
            ) {
                members.push({
                    name: attributes.full_name,
                    cents: attributes.currently_entitled_amount_cents,
                })
            }
        }

        cursor = meta.pagination.cursors?.next ?? null
    } while (cursor)

    const byTier: Record<number, string[]> = {}

    for (const { name, cents } of members.toSorted((a, b) => a.name.localeCompare(b.name))) {
        ;(byTier[cents] ??= []).push(name)
    }

    return byTier
}
