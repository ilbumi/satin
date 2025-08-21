import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	server: {
		hmr: {
			overlay: false
		}
	},
	build: {
		sourcemap: true,
		rollupOptions: {
			onwarn(warning, warn) {
				// Ignore sourcemap warnings for node_modules
				if (warning.code === 'SOURCEMAP_ERROR' && warning.message.includes('node_modules')) {
					return;
				}
				warn(warning);
			},
			output: {
				// Enhanced chunk splitting strategy - disabled due to SSR externals
				// manualChunks: {},
				// Optimize chunk naming for better caching
				// chunkFileNames: (chunkInfo) => {
				//	const name = chunkInfo.name;
				//	// Dynamic chunks for components
				//	if (chunkInfo.isDynamicEntry) {
				//		return 'components/[name]-[hash].js';
				//	}
				//	return 'chunks/[name]-[hash].js';
				// },
				// Optimize entry naming
				entryFileNames: 'app/[name]-[hash].js',
				// Optimize asset naming
				assetFileNames: (assetInfo) => {
					if (assetInfo.name) {
						// Group by file type
						const ext = assetInfo.name.split('.').pop();
						if (['css'].includes(ext || '')) {
							return 'styles/[name]-[hash][extname]';
						}
						if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext || '')) {
							return 'images/[name]-[hash][extname]';
						}
						if (['woff', 'woff2', 'ttf', 'eot'].includes(ext || '')) {
							return 'fonts/[name]-[hash][extname]';
						}
					}
					return 'assets/[name]-[hash][extname]';
				}
			}
		},
		// Enable tree shaking and advanced optimizations
		target: 'esnext',
		minify: 'esbuild',
		// More aggressive chunk splitting
		chunkSizeWarningLimit: 500, // Lowered to encourage smaller chunks
		// Rollup optimization options
		reportCompressedSize: true,
		// Preload module resolution optimization
		modulePreload: {
			polyfill: true
			// No manual chunks = no custom preload logic needed
			// resolveDependencies: (filename, deps, { hostId, hostType: _hostType }) => {
			//	// Preload critical chunks
			//	return deps.filter((dep) => {
			//		// Always preload framework chunks
			//		if (dep.includes('svelte-vendor') || dep.includes('ui-vendor')) {
			//			return true;
			//		}
			//		return false;
			//	});
			// }
		}
	},
	ssr: {
		external: ['konva', 'canvas']
	},
	define: {
		global: 'globalThis'
	},
	test: {
		projects: [
			{
				plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
				server: {
					hmr: {
						overlay: false
					}
				},
				ssr: {
					external: ['konva', 'canvas']
				},
				define: {
					global: 'globalThis'
				},
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['./src/vitest-setup.ts']
				}
			},
			{
				plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
				server: {
					hmr: {
						overlay: false
					}
				},
				ssr: {
					external: ['konva', 'canvas']
				},
				define: {
					global: 'globalThis'
				},
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						headless: true,
						instances: [{ browser: 'chromium' }],
						api: {
							port: 0
						},
						isolate: false,
						ui: false
					},
					retry: 0,
					testTimeout: 30000,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			}
		]
	}
});
