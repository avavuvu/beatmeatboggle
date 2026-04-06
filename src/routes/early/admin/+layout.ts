import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';

export const prerender = false;

export const load = ({ url }) => {
    const token = browser ? localStorage.getItem('admin_token') : null;
    const isAdmin = !!token;

    if (!isAdmin && browser) {
        redirect(303, '/early');
    }

    return {
        isAdmin,
        currentPath: url.pathname,
    };
};