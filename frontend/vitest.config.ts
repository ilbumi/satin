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
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			reportsDirectory: './coverage',
			exclude: [
				'coverage/**',
				'dist/**',
				'**/node_modules/**',
				'**/[.]**',
				'**/*.d.ts',
				'**/*.config.*',
				'**/vitest-setup*.ts',
				'src/app.html',
				'src/hooks.client.ts',
				'src/hooks.server.ts',
				'src/service-worker.ts'
			],
			thresholds: {
				lines: 70,
				functions: 70,
				branches: 60,
				statements: 70
			}
		},
		projects: [
			{
				...baseConfig,
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['./src/vitest-setup.ts'],
					coverage: {
						include: ['src/**/*.{js,ts}'],
						exclude: ['src/**/*.svelte', 'src/**/*.svelte.{test,spec}.{js,ts}']
					}
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
					setupFiles: ['./vitest-setup-client.ts'],
					coverage: {
						include: ['src/**/*.svelte', 'src/**/*.{js,ts}'],
						exclude: ['src/lib/server/**', 'src/**/*.{test,spec}.{js,ts}']
					}
				}
			}
		]
	}
});
