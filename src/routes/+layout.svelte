<script lang="ts">
	import "./layout.css";
	import { description, title } from "$lib/constants";
	import { page } from "$app/state";
    import preferences from "$lib/Preferences.svelte"

	let { children } = $props();

	$effect(() => {
		document.body!.setAttribute(
            "data-theme",
            preferences.settings.darkMode.value ? "dark" : "light"
        )
	})
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" type="image/png" sizes="48x48" href="/favicon.png" />

	<meta name="author" content="Ava Dinh-Vu" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Beat Me At Boggle" />
	<meta property="og:url" content={page.url.href} />
	<meta property="og:image" content={`${page.url.origin}/img.png`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />


	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebSite",
		"name": "Beat Me At Boggle",
		"url": page.url.origin,
		"description": description,
		"author": {
			"@type": "Person",
			"name": "Ava Dinh-Vu"
		}
	})}<\/script>`}
</svelte:head>
{@render children()}
