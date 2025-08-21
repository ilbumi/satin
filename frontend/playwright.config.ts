import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
	// Global setup and teardown
	globalSetup: path.resolve('./e2e/global-setup.ts'),
	globalTeardown: path.resolve('./e2e/global-teardown.ts'),
	webServer: [
		// Start backend server
		{
			command:
				'cd .. && make mongo-start && DISABLE_RATE_LIMITING=true uv run satin --host 0.0.0.0 --port 8000 --no-reload',
			port: 8000,
			reuseExistingServer: !process.env.CI,
			timeout: 120 * 1000, // 2 minutes for backend to start
			stderr: 'pipe',
			stdout: 'pipe'
		},
		// Start frontend dev server with increased memory
		{
			command: 'NODE_OPTIONS="--max-old-space-size=4096" pnpm run dev',
			port: 5173,
			reuseExistingServer: !process.env.CI,
			timeout: 180 * 1000, // 3 minutes for dev server to start (increased)
			stderr: 'pipe',
			stdout: 'pipe'
		}
	],
	testDir: 'e2e',
	// Global test timeout (increased)
	timeout: 90 * 1000, // 90 seconds per test
	// Expect timeout
	expect: {
		timeout: 15 * 1000 // 15 seconds (increased)
	},
	// Run tests in serial to avoid interference
	workers: 1,
	// Fresh context for each test
	fullyParallel: false,
	// Retry on failure (increased retries for stability)
	retries: process.env.CI ? 3 : 2,
	// Combined use configuration
	use: {
		headless: true,
		// Add navigation and action timeouts (increased)
		navigationTimeout: 30 * 1000, // 30 seconds
		actionTimeout: 15 * 1000, // 15 seconds
		// Add base URL for consistent navigation
		baseURL: 'http://localhost:5173',
		// Capture screenshots on failure
		screenshot: 'only-on-failure',
		// Record video on first retry
		video: 'retain-on-failure',
		// Add trace collection for debugging
		trace: 'retain-on-failure'
	}
});
