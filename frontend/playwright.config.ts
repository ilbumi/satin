import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'pnpm run dev',
		port: 5173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'e2e',
	use: {
		headless: true
	},
	// Run tests in serial to avoid interference
	workers: 1,
	// Fresh context for each test
	fullyParallel: false
});
