import type { Config } from "@netlify/functions"

export default async function (): Promise<Response> {
    await fetch(process.env.BUILD_HOOK_URL!, { method: "POST" })
    return new Response("OK", { status: 200 })
}

export const config: Config = {
    schedule: "0 14 * * *",
}
