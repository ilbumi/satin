import { createClient, fetchExchange, cacheExchange } from '@urql/svelte';

export const client = createClient({
	url: 'http://localhost:8000/graphql',
	exchanges: [
		// Temporarily use basic cache exchange for debugging
		cacheExchange,
		fetchExchange
	],
	fetchOptions: () => ({
		credentials: 'include'
	}),
	// Use cache-and-network for fresh data
	requestPolicy: 'cache-and-network'
});
