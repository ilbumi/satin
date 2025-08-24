// Re-export client
export { client } from './client';

// Re-export generated types and documents
export * from './generated';

// Utility type for GraphQL errors
export interface GraphQLError {
	message: string;
	locations?: Array<{
		line: number;
		column: number;
	}>;
	path?: Array<string | number>;
	extensions?: Record<string, unknown>;
}

// Utility type for operation results
export interface OperationResult<T = unknown> {
	data?: T;
	error?: {
		graphQLErrors: GraphQLError[];
		networkError?: Error;
		message: string;
	};
	fetching: boolean;
	stale: boolean;
}
