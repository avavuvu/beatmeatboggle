import { neon } from "@neondatabase/serverless"

export const readOnlyDb = () => {
    const url = process.env.READONLY_DATABASE_URL
    if (!url) {
        throw new Error("READONLY_DATABASE_URL is not set")
    }
    return neon(url)
}
