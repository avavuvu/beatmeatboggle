import type { Config, Context } from "@netlify/functions";
import { timingSafeEqual } from 'crypto';

export default async function login(req: Request, context: Context) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    let password: string;
    try {
        const body = await req.json();
        password = String(body.password ?? '');
    } catch {
        return new Response('Bad Request', { status: 400 });
    }

    const expected = process.env.ADMIN_PASSWORD ?? '';

    // Pad to equal length before comparing
    const maxLen = Math.max(expected.length, password.length, 64);
    const a = Buffer.from(expected.padEnd(maxLen));
    const b = Buffer.from(password.padEnd(maxLen));
    const match = timingSafeEqual(a, b);

    if (!match) {
        return new Response('Unauthorized', { status: 401 });
    }

    return Response.json({ token: process.env.ADMIN_TOKEN });
}

export const config: Config = {
    path: "/early/admin/login"
};