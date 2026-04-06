import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
    const dateKey = url.searchParams.get("date")

    if (!dateKey) {
        return redirect(400, "/early/admin")
    }

    return {
        dateKey
    }
};