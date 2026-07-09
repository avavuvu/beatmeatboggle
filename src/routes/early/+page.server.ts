import { fail, redirect } from "@sveltejs/kit"
import { dev } from "$app/environment"
import { ADMIN_PASSWORD } from "$env/static/private"
import { timingSafeEqual } from "node:crypto"
import { createSession } from "$lib/session"
import type { Actions } from "@sveltejs/kit"

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData()
        const password = String(data.get("password") ?? "")
        const expected = ADMIN_PASSWORD ?? ""
        const len = Math.max(expected.length, password.length, 64)

        if (
            !timingSafeEqual(
                Buffer.from(expected.padEnd(len)),
                Buffer.from(password.padEnd(len))
            )
        ) {
            return fail(401, { error: "Wrong password." })
        }

        cookies.set("admin_session", createSession({ admin: true }), {
            path: "/",
            httpOnly: true,
            secure: !dev,
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7,
        })

        redirect(303, "/early/admin")
    },
}
