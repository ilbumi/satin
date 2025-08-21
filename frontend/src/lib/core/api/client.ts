import { Client, fetchExchange, errorExchange, type CombinedError } from '@urql/core';
import { env } from '$lib/config';
import { APIError, parseGraphQLError } from './errors';
import { errorStore } from '$lib/core/errors';
import { createEnhancedCacheExchange } from './cache';

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
		errorStore.addNetworkError(error.networkError.message, 'GraphQL Client', () => {
			// Could implement retry logic here
			console.log('Retrying GraphQL operation...');
		});
	}

	// Handle GraphQL errors
	if (error.graphQLErrors && error.graphQLErrors.length > 0) {
		error.graphQLErrors.forEach((gqlError) => {
			console.error('GraphQL error:', gqlError.message);
			errorStore.addGraphQLError(
				gqlError.message,
				`GraphQL Operation: ${gqlError.path?.join('.')}`
			);
		});
	}

	// If no specific errors but still an error, add a general error
	if (!error.networkError && (!error.graphQLErrors || error.graphQLErrors.length === 0)) {
		errorStore.addSystemError(
			error.message || 'An unknown GraphQL error occurred',
			'GraphQL Client'
		);
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
			// Enhanced cache exchange with normalization and cache updates
			createEnhancedCacheExchange(),
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
 * Lazy-initialized to avoid SSR issues
 */
let _graphqlClient: Client | null = null;

export const graphqlClient = {
	get client(): Client {
		if (!_graphqlClient) {
			_graphqlClient = createGraphQLClient();
		}
		return _graphqlClient;
	},

	// Proxy the most common client methods for convenience
	query: (...args: Parameters<Client['query']>) => {
		return graphqlClient.client.query(...args);
	},

	mutation: (...args: Parameters<Client['mutation']>) => {
		return graphqlClient.client.mutation(...args);
	},

	subscription: (...args: Parameters<Client['subscription']>) => {
		return graphqlClient.client.subscription(...args);
	}
};

/**
 * Connection test result with detailed error information
 */
export interface ConnectionResult {
	success: boolean;
	error?: APIError;
	details?: string;
}

/**
 * Helper to check if the GraphQL client can connect to the backend
 * @deprecated Use testConnectionDetailed() for better error handling
 */
export async function testConnection(): Promise<boolean> {
	const result = await testConnectionDetailed();
	return result.success;
}

/**
 * Enhanced connection test with detailed error information
 */
export async function testConnectionDetailed(): Promise<ConnectionResult> {
	try {
		const result = await graphqlClient.client.query('{ __typename }', {}).toPromise();

		if (result.error) {
			const apiError = parseGraphQLError(result.error);
			return {
				success: false,
				error: apiError,
				details: getConnectionErrorDetails(apiError)
			};
		}

		if (result.data?.__typename === 'Query') {
			return {
				success: true
			};
		}

		return {
			success: false,
			error: new APIError('Invalid response from GraphQL server', 'SERVER_ERROR'),
			details: 'Server returned unexpected response format'
		};
	} catch (error) {
		if (env.isDevelopment) {
			console.error('GraphQL connection test failed:', error);
		}

		const apiError =
			error instanceof APIError
				? error
				: new APIError('Failed to connect to GraphQL server', 'NETWORK_ERROR');

		return {
			success: false,
			error: apiError,
			details: getConnectionErrorDetails(apiError)
		};
	}
}

/**
 * Get user-friendly error details for connection errors
 */
function getConnectionErrorDetails(error: APIError): string {
	switch (error.type) {
		case 'NETWORK_ERROR':
			return 'Unable to reach the backend server. Please check if the server is running and accessible.';
		case 'SERVER_ERROR':
			return 'The backend server encountered an error. Please try again or contact support.';
		case 'GRAPHQL_ERROR':
			return 'The GraphQL server returned an error. Please check server logs for details.';
		default:
			return 'An unexpected error occurred while connecting to the server.';
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
