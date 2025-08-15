import { defineConfig } from '@playwright/test';
import { server } from './src/mocks/server';

server.listen();

export default defineConfig({
	webServer: {
		command: 'pnpm run dev',
		port: 5173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'e2e',
	use: {
		headless: true
	}
});
