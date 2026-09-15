import type { PatronSession } from "$lib/server/session"

declare global {
    namespace App {
        interface Error {
            code?: string
            id?: string
        }

        interface Locals {
            patron: PatronSession | null
        }
    }
}

export {}
