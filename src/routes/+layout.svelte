<script lang="ts">
	import './layout.css';
	import { assets } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="{assets}/favicon.png" type="image/png" />
	<title>FlowCode</title>
</svelte:head>
{@render children()}
