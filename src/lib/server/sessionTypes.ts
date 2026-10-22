export type PatronTier = "free" | "paid"

export type PatronSession = {
    patreonUserId: string
    tier: PatronTier
    fullName: string | null
    thumbUrl: string | null
    accessToken: string
    refreshToken: string
    checkedAt: number
}

export const PATRON_COOKIE = "patron_session"
