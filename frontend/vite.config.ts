import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],

	build: {
		// Enable build analysis in analyze mode
		rollupOptions: {
			output: {
				// Manual chunk splitting for better caching
				manualChunks: (id) => {
					// Vendor chunks
					if (id.includes('node_modules')) {
						// URQL and GraphQL related packages
						if (id.includes('@urql') || id.includes('urql') || id.includes('graphql')) {
							return 'urql';
						}
						// SvelteKit framework
						if (id.includes('@sveltejs/kit')) {
							return 'svelte-kit';
						}
						// Other vendor code
						return 'vendor';
					}

					// Route-based code splitting for large components
					if (id.includes('AnnotationCanvas')) {
						return 'annotation-canvas';
					}
					if (id.includes('ImageGrid') || id.includes('ImageCard') || id.includes('ImageFilter')) {
						return 'image-components';
					}
				}
			}
		},
		// Generate source maps for analysis
		sourcemap: process.env.NODE_ENV === 'analyze',
		// Tree-shaking optimization
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true, // Remove console.log in production
				drop_debugger: true
			}
		}
	},

	// Optimize dependencies
	optimizeDeps: {
		include: ['@urql/svelte', 'graphql'],
		exclude: ['@sveltejs/kit'] // Let SvelteKit handle its own optimization
	},
	test: {
		expect: { requireAssertions: true },
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/**',
				'src/test/**',
				'**/*.d.ts',
				'**/*.config.*',
				'**/build/**',
				'**/dist/**'
			]
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }],
						headless: true
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts'],
					pool: 'browser'
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
