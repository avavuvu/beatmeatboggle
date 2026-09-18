import { redirect } from "@sveltejs/kit"
import { clearPatronCookie } from "$lib/server/session"
import type { RequestEvent } from "@sveltejs/kit"

export const POST = ({ cookies }: RequestEvent) => {
    clearPatronCookie(cookies)
    redirect(303, "/")
}
