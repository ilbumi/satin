import { test as base } from '@playwright/test';

import { createWorkerFixture, MockServiceWorker } from 'playwright-msw';
import { handlers } from './mocks';

console.log('Loading test.ts');

const worker = createWorkerFixture(handlers);

export const test = base.extend<{ worker: MockServiceWorker }>({
	worker: async ({ page }, use) => {
		console.log('Setting up MSW worker for test');

		// Start the worker for this page
		await worker.use(page);

		// Wait a bit for the service worker to register
		await page.waitForTimeout(100);

		// Verify the worker is running by checking for the service worker
		await page.evaluate(() => {
			if (navigator.serviceWorker && navigator.serviceWorker.controller) {
				console.log('✅ Service worker is active');
			} else {
				console.warn('⚠️ Service worker not active');
			}
		});

		await use(worker);
	}
});

export { expect } from '@playwright/test';
