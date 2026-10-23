import { createHmac, timingSafeEqual } from "node:crypto"
import { PATRON_COOKIE, type PatronSession } from "./sessionTypes"

const cookieValue = (req: Request, name: string): string | undefined => {
    const header = req.headers.get("cookie") ?? ""
    for (const part of header.split(";")) {
        const [key, ...rest] = part.trim().split("=")
        if (key === name) return decodeURIComponent(rest.join("="))
    }
    return undefined
}

const verify = (
    cookie: string | undefined,
    secret: string | undefined
): PatronSession | null => {
    if (!cookie || !secret) return null
    const dot = cookie.lastIndexOf(".")
    if (dot === -1) return null
    const payload = cookie.slice(0, dot)
    const sig = Buffer.from(cookie.slice(dot + 1))
    const expected = Buffer.from(
        createHmac("sha256", secret).update(payload).digest("hex")
    )
    if (sig.length !== expected.length || !timingSafeEqual(sig, expected))
        return null
    try {
        return JSON.parse(
            Buffer.from(payload, "base64url").toString()
        ) as PatronSession
    } catch {
        return null
    }
}

export const isPatron = (req: Request): boolean =>
    verify(cookieValue(req, PATRON_COOKIE), process.env.SESSION_SECRET)
        ?.tier === "paid"

export const isAdmin = (req: Request): boolean => {
    const token = process.env.ADMIN_TOKEN
    return !!token && req.headers.get("authorization") === token
}
