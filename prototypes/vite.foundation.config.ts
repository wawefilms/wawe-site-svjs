import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Standalone board preview: bypass SvelteKit routing, reuse the real site tokens/fonts.
// Run from the site root; this config is not used for production builds.
export default defineConfig({
	publicDir: 'static',
	plugins: [tailwindcss()],
	// Development-only, fixed upstreams for the stacking study. CMS/R2 do not
	// grant localhost CORS; do not send browser credentials or alter production CORS.
	server: {
		proxy: {
			'/__stacking-api': {
				target: 'https://cms.wawefilms.com', changeOrigin: true,
				rewrite: path => path.replace(/^\/__stacking-api/, '/api'),
				configure: proxy => proxy.on('proxyReq', request => { request.removeHeader('cookie'); request.removeHeader('authorization'); })
			},
			'/__stacking-media': {
				target: 'https://media.wawefilms.com', changeOrigin: true,
				rewrite: path => path.replace(/^\/__stacking-media/, ''),
				configure: proxy => proxy.on('proxyReq', request => { request.removeHeader('cookie'); request.removeHeader('authorization'); })
			}
		}
	}
});
