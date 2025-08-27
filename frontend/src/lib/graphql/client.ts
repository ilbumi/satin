import { createClient, cacheExchange, fetchExchange } from '@urql/svelte';
import { browser } from '$app/environment';

export const client = createClient({
	url: 'http://localhost:8000/graphql',
	exchanges: [cacheExchange, fetchExchange],
	fetchOptions: () => ({
		credentials: 'include'
	}),
	// Only enable requestPolicy changes in browser
	requestPolicy: browser ? 'cache-first' : 'cache-and-network'
});
