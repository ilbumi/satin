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

		// Wait longer for the service worker to register properly
		await page.waitForTimeout(500);

		// Verify the worker is running and wait for it to be ready
		let retries = 0;
		const maxRetries = 10;

		while (retries < maxRetries) {
			const isWorkerReady = await page.evaluate(() => {
				return new Promise<boolean>((resolve) => {
					if (navigator.serviceWorker && navigator.serviceWorker.controller) {
						console.log('✅ Service worker is active');
						resolve(true);
					} else {
						console.warn('⚠️ Service worker not active, waiting...');
						resolve(false);
					}
				});
			});

			if (isWorkerReady) {
				break;
			}

			await page.waitForTimeout(200);
			retries++;
		}

		// Additional wait to ensure MSW handlers are registered
		await page.waitForTimeout(300);

		await use(worker);
	}
});

export { expect } from '@playwright/test';
