import { dev } from '$app/environment';

async function enableMocking() {
	if (dev || import.meta.env.MODE === 'test') {
		try {
			const { enableMocking } = await import('./mocks/browser');
			await enableMocking();
			console.log('🔶 MSW: Service worker enabled for development/testing');
		} catch (error) {
			console.warn('MSW: Failed to enable service worker:', error);
		}
	}
}

// Enable MSW as early as possible
enableMocking();
