import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Respect BASE_PATH env var (set for sub-path deployments like GitHub Pages)
const base = process.env.BASE_PATH ?? '';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			// SvelteKit generates HTML via adapter (post-build), not Vite's
			// transformIndexHtml, so we handle manifest link + SW registration
			// manually in app.html and +layout.svelte.
			injectRegister: null,
			// Tell the plugin about the base path so the SW scope is correct.
			base: base ? `${base}/` : '/',
			includeAssets: ['favicon.png', 'robots.txt'],
			manifest: {
				name: 'FlowCode',
				short_name: 'FlowCode',
				description: 'Visual Flow Programming for ESP32 / Arduino',
				theme_color: '#0f172a',
				background_color: '#0f172a',
				display: 'standalone',
				orientation: 'any',
				// Use base-aware start_url and scope
				start_url: base ? `${base}/` : '/',
				scope:     base ? `${base}/` : '/',
				icons: [
					// Use relative paths (relative to manifest location) so
					// they resolve correctly regardless of the base path.
					{
						src: 'favicon.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: 'favicon.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2,webp,png}'],
				// Use the correct SW scope for sub-path deployments
				navigateFallback: null,
				runtimeCaching: [
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pages',
							networkTimeoutSeconds: 3,
						},
					},
					{
						urlPattern: /\.(?:js|css|woff2?)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'assets',
							expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 },
						},
					},
				],
			},
			devOptions: {
				enabled: false,
			},
		}),
	],
});
