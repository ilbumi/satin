import { test as base } from '@playwright/test';

import { createWorkerFixture, MockServiceWorker } from 'playwright-msw';
import { handlers } from './mocks';

console.log('Loading test.ts');

const worker = createWorkerFixture(handlers);

export const test = base.extend<{ worker: MockServiceWorker }>({
	// eslint-disable-next-line no-empty-pattern
	worker: async ({}, use) => {
		console.log('Setting up worker');
		await use(worker);
	}
});

export { expect } from '@playwright/test';
