/**
 * Core API module exports
 * Provides GraphQL client, queries, helpers, error handling, and mocks
 */

// Client and configuration
export {
	createGraphQLClient,
	graphqlClient,
	testConnection,
	testConnectionDetailed,
	getConnectionInfo,
	type ConnectionResult
} from './client';

// GraphQL queries and mutations
export * from './queries';

// API helpers and services
export { api, projectAPI, imageAPI, taskAPI, type GraphQLResult } from './helpers';

// Error handling
export {
	APIError,
	parseGraphQLError,
	getErrorMessage,
	isRetryableError,
	withRetry,
	isAPIError,
	type APIErrorType
} from './errors';
