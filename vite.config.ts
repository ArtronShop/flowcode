import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.png', 'robots.txt'],
			manifest: {
				name: 'FlowCode',
				short_name: 'FlowCode',
				description: 'Visual Flow Programming for ESP32 / Arduino',
				theme_color: '#0f172a',
				background_color: '#0f172a',
				display: 'standalone',
				orientation: 'any',
				start_url: '/',
				scope: '/',
				icons: [
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
				// Pre-cache all build assets
				globPatterns: ['**/*.{js,css,html,svg,ico,woff,woff2,webp,png}'],
				// Cache strategies for runtime requests
				runtimeCaching: [
					{
						// SvelteKit page navigation — network-first with offline fallback
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pages',
							networkTimeoutSeconds: 3,
						},
					},
					{
						// Static assets — cache-first
						urlPattern: /\.(?:js|css|woff2?)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'assets',
							expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 },
						},
					},
				],
				// Don't cache the SvelteKit service worker itself
				navigateFallback: null,
			},
			devOptions: {
				enabled: false, // disable SW in dev to avoid caching issues
			},
		}),
	],
});
