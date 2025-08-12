import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './tests/e2e',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [['html'], ['json', { outputFile: 'test-results/results.json' }]],
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.BASE_URL || 'http://localhost:5173',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',

		/* Take screenshot on failure */
		screenshot: 'only-on-failure',

		/* Record video on failure */
		video: 'retain-on-failure'
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}

		/* Other browsers commented out for faster testing - uncomment when needed */
		// {
		// 	name: 'firefox',
		// 	use: { ...devices['Desktop Firefox'] }
		// },
		//
		// {
		// 	name: 'webkit',
		// 	use: { ...devices['Desktop Safari'] }
		// },
		//
		// /* Test against mobile viewports. */
		// {
		// 	name: 'Mobile Chrome',
		// 	use: { ...devices['Pixel 5'] }
		// },
		// {
		// 	name: 'Mobile Safari',
		// 	use: { ...devices['iPhone 12'] }
		// }

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	webServer: [
		{
			command: '../scripts/test-backend-setup.sh',
			reuseExistingServer: !process.env.CI,
			timeout: 180 * 1000,
			env: {
				MONGO_DSN: process.env.MONGO_DSN || 'mongodb://localhost:27017/satin-test',
				ENVIRONMENT: 'test',
				LOG_LEVEL: 'info'
			},
			// Wait for GraphQL endpoint to be ready
			url: 'http://localhost:8000/graphql'
		},
		{
			command: 'pnpm run dev --host 0.0.0.0',
			port: 5173,
			reuseExistingServer: !process.env.CI,
			timeout: 120 * 1000,
			env: {
				VITE_API_URL: 'http://localhost:8000'
			}
		}
	]
});
