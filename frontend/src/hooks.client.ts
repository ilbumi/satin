import { dev } from '$app/environment';

async function enableMocking() {
	if (dev || import.meta.env.MODE === 'test') {
		try {
			const { enableMocking } = await import('./mocks/browser');
			await enableMocking();
			// Only log in development, not in tests
			if (!import.meta.env.VITEST && import.meta.env.NODE_ENV !== 'test') {
				console.log('🔶 MSW: Service worker enabled for development/testing');
			}
		} catch (error) {
			// Only warn in development, not in tests
			if (!import.meta.env.VITEST && import.meta.env.NODE_ENV !== 'test') {
				console.warn('MSW: Failed to enable service worker:', error);
			}
		}
	}
}

// Enable MSW as early as possible
enableMocking();
