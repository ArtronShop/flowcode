<script lang="ts">
	import './layout.css';
	import { assets } from '$app/paths';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(async () => {
		if ('serviceWorker' in navigator) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: false });
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="{assets}/favicon.png" type="image/png" />
	<title>FlowCode</title>
</svelte:head>
{@render children()}
