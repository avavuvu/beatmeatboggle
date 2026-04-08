import type { OptionsSvelteSitemap } from 'svelte-sitemap';

const config: OptionsSvelteSitemap = {
    domain: 'https://beatmeatboggle.com',
    trailingSlashes: true,
    ignore: ['**/early/**']
};

export default config;