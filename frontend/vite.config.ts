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
			}
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
