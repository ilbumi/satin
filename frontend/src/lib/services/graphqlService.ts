import type { Client } from '@urql/svelte';
import type { GraphQLResponse, GraphQLVariables } from '$lib/types';

export class GraphQLService {
	constructor(private client: Client) {}

	/**
	 * Execute a GraphQL query with error handling
	 */
	async query<TData>(query: string, variables?: GraphQLVariables): Promise<TData> {
		const result = await this.client.query(query, variables).toPromise();

		if (result.error) {
			throw new Error(result.error.message);
		}

		if (!result.data) {
			throw new Error('No data received from GraphQL query');
		}

		return result.data as TData;
	}

	/**
	 * Execute a GraphQL mutation with error handling
	 */
	async mutation<TData>(mutation: string, variables?: GraphQLVariables): Promise<TData> {
		const result = await this.client.mutation(mutation, variables).toPromise();

		if (result.error) {
			throw new Error(result.error.message);
		}

		if (!result.data) {
			throw new Error('No data received from GraphQL mutation');
		}

		return result.data as TData;
	}

	/**
	 * Execute a query and return the raw result for custom error handling
	 */
	async queryRaw<TData>(
		query: string,
		variables?: GraphQLVariables
	): Promise<GraphQLResponse<TData>> {
		const result = await this.client.query(query, variables).toPromise();

		return {
			data: result.data as TData,
			errors: result.error ? [{ message: result.error.message }] : undefined
		};
	}

	/**
	 * Execute a mutation and return the raw result for custom error handling
	 */
	async mutationRaw<TData>(
		mutation: string,
		variables?: GraphQLVariables
	): Promise<GraphQLResponse<TData>> {
		const result = await this.client.mutation(mutation, variables).toPromise();

		return {
			data: result.data as TData,
			errors: result.error ? [{ message: result.error.message }] : undefined
		};
	}

	/**
	 * Check if a GraphQL response has errors
	 */
	hasErrors<TData>(response: GraphQLResponse<TData>): boolean {
		return !!(response.errors && response.errors.length > 0);
	}

	/**
	 * Get the first error message from a GraphQL response
	 */
	getFirstError<TData>(response: GraphQLResponse<TData>): string | null {
		if (this.hasErrors(response)) {
			return response.errors![0].message;
		}
		return null;
	}

	/**
	 * Transform GraphQL errors into user-friendly messages
	 */
	formatError(error: Error): string {
		// Handle common error patterns
		if (error.message.includes('Network request failed')) {
			return 'Unable to connect to the server. Please check your internet connection.';
		}

		if (error.message.includes('Unauthorized')) {
			return 'You are not authorized to perform this action.';
		}

		if (error.message.includes('Not found')) {
			return 'The requested resource was not found.';
		}

		if (error.message.includes('Validation failed')) {
			return 'Please check your input and try again.';
		}

		// Return the original error message for development
		return error.message;
	}
}
