import { createClient, fetchExchange } from '@urql/svelte';
import { browser } from '$app/environment';
import { graphcacheExchange } from './cache';

export const client = createClient({
	url: 'http://localhost:8000/graphql',
	exchanges: [
		// Use our configured graphcache exchange instead of basic cacheExchange
		graphcacheExchange,
		fetchExchange
	],
	fetchOptions: () => ({
		credentials: 'include'
	}),
	// More aggressive caching with normalized cache
	requestPolicy: browser ? 'cache-first' : 'cache-and-network'
});
