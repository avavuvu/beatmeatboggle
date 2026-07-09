import { createHmac, timingSafeEqual } from "node:crypto"
import { SESSION_SECRET } from "$env/static/private"

export type AdminSession = {
    admin: true
}

export type PatronTier = "free" | "paid"

export type PatronSession = {
    patreonUserId: string
    tier: PatronTier
    fullName: string | null
    thumbUrl: string | null
}

const sign = (payload: string) =>
    createHmac("sha256", SESSION_SECRET).update(payload).digest("hex")

export const createSession = <T extends Record<string, unknown>>(
    data: T
): string => {
    const payload = Buffer.from(JSON.stringify(data)).toString("base64url")
    return `${payload}.${sign(payload)}`
}

export const parseSession = <T extends Record<string, unknown>>(
    cookie: string | undefined
): T | null => {
    if (!cookie) return null
    const dot = cookie.lastIndexOf(".")
    if (dot === -1) return null
    const payload = cookie.slice(0, dot)
    const sig = cookie.slice(dot + 1)
    const expected = sign(payload)
    if (sig.length !== expected.length) return null
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    try {
        return JSON.parse(Buffer.from(payload, "base64url").toString()) as T
    } catch {
        return null
    }
}
