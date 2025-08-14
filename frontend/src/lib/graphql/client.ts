import { Client, cacheExchange, fetchExchange } from '@urql/svelte';

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Custom fetch with timeout
const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
	const timeout = 10000; // 10 second timeout

	return new Promise((resolve, reject) => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
			reject(new Error('GraphQL request timeout - backend may be unreachable'));
		}, timeout);

		fetch(input, { ...init, signal: controller.signal })
			.then((response) => {
				clearTimeout(timeoutId);
				resolve(response);
			})
			.catch((error) => {
				clearTimeout(timeoutId);
				if (error.name === 'AbortError') {
					reject(new Error('GraphQL request timeout - backend may be unreachable'));
				} else {
					reject(error);
				}
			});
	});
};

export const client = new Client({
	url: `${API_URL}/graphql`,
	exchanges: [cacheExchange, fetchExchange],
	// Use custom fetch with timeout
	fetch: fetchWithTimeout,
	// Add default request policy to avoid cache issues in tests
	requestPolicy: 'cache-and-network'
});
