import type { Config } from "@netlify/functions"
import { purgeCache } from "@netlify/functions"

export default async function (): Promise<Response> {
    await purgeCache({ tags: ["play-page"] })
    return new Response("OK", { status: 200 })
}

export const config: Config = {
    schedule: "0 14 * * *",
}
