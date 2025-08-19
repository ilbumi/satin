import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
	// Global setup and teardown
	globalSetup: path.resolve('./e2e/global-setup.ts'),
	globalTeardown: path.resolve('./e2e/global-teardown.ts'),
	webServer: [
		// Start MongoDB first
		{
			command: 'cd .. && make mongo-start',
			port: 27017,
			reuseExistingServer: !process.env.CI,
			timeout: 60 * 1000, // 1 minute for MongoDB to start
			stderr: 'pipe',
			stdout: 'pipe'
		},
		// Start backend server
		{
			command:
				'cd .. && MONGO_DSN="mongodb://admin:password@localhost:27017/satin?authSource=admin" uv run granian --interface asgi --host 0.0.0.0 --port 8000 satin:app',
			port: 8000,
			reuseExistingServer: !process.env.CI,
			timeout: 60 * 1000, // 1 minute for backend to start
			stderr: 'pipe',
			stdout: 'pipe'
		},
		// Start frontend dev server
		{
			command: 'pnpm run dev',
			port: 5173,
			reuseExistingServer: !process.env.CI,
			timeout: 120 * 1000, // 2 minutes for dev server to start
			stderr: 'pipe',
			stdout: 'pipe'
		}
	],
	testDir: 'e2e',
	// Global test timeout
	timeout: 60 * 1000, // 60 seconds per test
	// Expect timeout
	expect: {
		timeout: 10 * 1000 // 10 seconds
	},
	// Run tests in serial to avoid interference
	workers: 1,
	// Fresh context for each test
	fullyParallel: false,
	// Retry on failure (useful for flaky tests)
	retries: process.env.CI ? 2 : 1,
	// Combined use configuration
	use: {
		headless: true,
		// Add navigation and action timeouts
		navigationTimeout: 30 * 1000, // 30 seconds
		actionTimeout: 10 * 1000, // 10 seconds
		// Add base URL for consistent navigation
		baseURL: 'http://localhost:5173',
		// Capture screenshots on failure
		screenshot: 'only-on-failure',
		// Record video on first retry
		video: 'retain-on-failure'
	}
});
