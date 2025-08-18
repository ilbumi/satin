import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Configure MSW worker for browser environment
export const worker = setupWorker(...handlers);

// Enable request interception in development/test environments
export function enableMocking(): Promise<ServiceWorkerRegistration | undefined> {
	// Only enable MSW in development or test environments
	if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'test')) {
		// Only log in development, not in tests
		if (!import.meta.env.VITEST && import.meta.env.NODE_ENV !== 'test') {
			console.log('🔶 MSW: Starting service worker...');
		}

		return worker.start({
			onUnhandledRequest: 'warn', // Warn about unhandled requests
			serviceWorker: {
				url: '/mockServiceWorker.js'
			}
		});
	}

	return Promise.resolve(undefined);
}
