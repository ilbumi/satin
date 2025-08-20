import { Client, cacheExchange, fetchExchange } from '@urql/core';

/**
 * GraphQL client for E2E tests
 * This client connects directly to the real backend server
 */
export function createTestGraphQLClient(): Client {
	return new Client({
		url: 'http://localhost:8000/graphql',
		exchanges: [cacheExchange, fetchExchange],
		requestPolicy: 'network-only', // Always fetch fresh data for tests
		fetchOptions: {
			headers: {
				'Content-Type': 'application/json'
			}
		}
	});
}

/**
 * Global test client instance
 */
export const testGraphQLClient = createTestGraphQLClient();
