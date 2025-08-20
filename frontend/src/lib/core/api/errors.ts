import type { CombinedError } from '@urql/core';

/**
 * Enhanced error types for better error handling
 */
export type APIErrorType =
	| 'NETWORK_ERROR'
	| 'GRAPHQL_ERROR'
	| 'VALIDATION_ERROR'
	| 'NOT_FOUND'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'SERVER_ERROR'
	| 'UNKNOWN_ERROR';

/**
 * Structured API error class
 */
export class APIError extends Error {
	public readonly type: APIErrorType;
	public readonly statusCode?: number;
	public readonly details?: unknown;

	constructor(
		message: string,
		type: APIErrorType = 'UNKNOWN_ERROR',
		statusCode?: number,
		details?: unknown
	) {
		super(message);
		this.name = 'APIError';
		this.type = type;
		this.statusCode = statusCode;
		this.details = details;

		// Maintain proper stack trace (only available in V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, APIError);
		}
	}
}

/**
 * Parse URQL CombinedError into structured APIError
 */
export function parseGraphQLError(error: CombinedError): APIError {
	// Handle network errors
	if (error.networkError) {
		const networkError = error.networkError;
		let statusCode: number | undefined;
		let type: APIErrorType = 'NETWORK_ERROR';

		// Extract status code from network error
		if ('status' in networkError) {
			statusCode = networkError.status as number;

			// Map HTTP status codes to error types
			switch (statusCode) {
				case 401:
					type = 'UNAUTHORIZED';
					break;
				case 403:
					type = 'FORBIDDEN';
					break;
				case 404:
					type = 'NOT_FOUND';
					break;
				case 500:
				case 502:
				case 503:
				case 504:
					type = 'SERVER_ERROR';
					break;
				default:
					type = 'NETWORK_ERROR';
			}
		}

		return new APIError(
			networkError.message || 'Network error occurred',
			type,
			statusCode,
			networkError
		);
	}

	// Handle GraphQL errors
	if (error.graphQLErrors && error.graphQLErrors.length > 0) {
		const firstError = error.graphQLErrors[0];
		let type: APIErrorType = 'GRAPHQL_ERROR';

		// Try to determine error type from GraphQL error
		if (firstError.extensions) {
			const code = firstError.extensions.code;
			switch (code) {
				case 'VALIDATION_ERROR':
					type = 'VALIDATION_ERROR';
					break;
				case 'NOT_FOUND':
					type = 'NOT_FOUND';
					break;
				case 'UNAUTHORIZED':
					type = 'UNAUTHORIZED';
					break;
				case 'FORBIDDEN':
					type = 'FORBIDDEN';
					break;
			}
		}

		return new APIError(firstError.message, type, undefined, error.graphQLErrors);
	}

	// Fallback for unknown errors
	return new APIError(error.message || 'Unknown error occurred', 'UNKNOWN_ERROR', undefined, error);
}

/**
 * User-friendly error messages
 */
export function getErrorMessage(error: APIError): string {
	switch (error.type) {
		case 'NETWORK_ERROR':
			return 'Unable to connect to the server. Please check your internet connection.';
		case 'UNAUTHORIZED':
			return 'You are not authorized to perform this action. Please log in.';
		case 'FORBIDDEN':
			return 'You do not have permission to perform this action.';
		case 'NOT_FOUND':
			return 'The requested resource was not found.';
		case 'VALIDATION_ERROR':
			return error.message; // Validation errors are usually user-friendly
		case 'SERVER_ERROR':
			return 'A server error occurred. Please try again later.';
		case 'GRAPHQL_ERROR':
			return error.message; // GraphQL errors are usually descriptive
		default:
			return 'An unexpected error occurred. Please try again.';
	}
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: APIError): boolean {
	return ['NETWORK_ERROR', 'SERVER_ERROR'].includes(error.type);
}

/**
 * Simple retry mechanism
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	maxRetries: number = 3,
	delay: number = 1000
): Promise<T> {
	let lastError: Error;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error('Unknown error');

			// Only retry if it's a retryable error and not the last attempt
			if (attempt < maxRetries && lastError instanceof APIError && isRetryableError(lastError)) {
				await new Promise((resolve) => setTimeout(resolve, delay * attempt));
				continue;
			}

			throw lastError;
		}
	}

	throw lastError!;
}

/**
 * Type guard to check if error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
	return error instanceof APIError;
}
