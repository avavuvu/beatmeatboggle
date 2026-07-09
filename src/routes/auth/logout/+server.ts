import { redirect } from "@sveltejs/kit"
import type { RequestEvent } from "@sveltejs/kit"

export const POST = ({ cookies }: RequestEvent) => {
    cookies.delete("patron_session", { path: "/" })
    redirect(303, "/")
}
