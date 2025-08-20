import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';

const baseConfig = {
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
	}
};

export default defineConfig({
	test: {
		projects: [
			{
				...baseConfig,
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['./src/vitest-setup.ts']
				}
			},
			{
				...baseConfig,
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
						isolate: true,
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
