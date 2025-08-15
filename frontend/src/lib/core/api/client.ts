import {
	Client,
	cacheExchange,
	fetchExchange,
	errorExchange,
	type CombinedError
} from '@urql/core';
import { env } from '$lib/config';

/**
 * GraphQL endpoint URL
 */
const GRAPHQL_URL = `${env.BACKEND_URL}/graphql`;

/**
 * Custom error handler for GraphQL operations
 */
function handleGraphQLError(error: CombinedError): void {
	if (env.isDevelopment) {
		console.error('GraphQL Error:', {
			networkError: error.networkError,
			graphQLErrors: error.graphQLErrors,
			message: error.message
		});
	}

	// Handle network errors
	if (error.networkError) {
		console.error('Network error occurred:', error.networkError.message);
		// Could dispatch to a global error store here
	}

	// Handle GraphQL errors
	if (error.graphQLErrors && error.graphQLErrors.length > 0) {
		error.graphQLErrors.forEach((gqlError) => {
			console.error('GraphQL error:', gqlError.message);
			// Could dispatch specific error types to global store here
		});
	}
}

/**
 * Create and configure the URQL GraphQL client
 */
export function createGraphQLClient(): Client {
	return new Client({
		url: GRAPHQL_URL,
		exchanges: [
			// Error exchange should be first to handle all errors
			errorExchange({
				onError: handleGraphQLError
			}),
			// Cache exchange for client-side caching
			cacheExchange,
			// Fetch exchange for making HTTP requests
			fetchExchange
		],
		// Request policy: cache-first for better performance
		requestPolicy: 'cache-first',
		// Additional fetch options
		fetchOptions: () => ({
			headers: {
				'Content-Type': 'application/json'
			}
		})
	});
}

/**
 * Default GraphQL client instance
 * Use this for most operations
 */
export const graphqlClient = createGraphQLClient();

/**
 * Helper to check if the GraphQL client can connect to the backend
 */
export async function testConnection(): Promise<boolean> {
	try {
		const result = await graphqlClient.query('{ __typename }', {}).toPromise();

		return !result.error && result.data?.__typename === 'Query';
	} catch (error) {
		console.error('GraphQL connection test failed:', error);
		return false;
	}
}

/**
 * Helper to get connection status information
 */
export function getConnectionInfo() {
	return {
		url: GRAPHQL_URL,
		isDevelopment: env.isDevelopment
	};
}
