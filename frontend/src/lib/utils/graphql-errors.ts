import type { CombinedError } from '@urql/svelte';

// Error type definitions matching backend
export interface ValidationError {
	__typename: 'ValidationError';
	field: string;
	message: string;
}

export interface NotFoundError {
	__typename: 'NotFoundError';
	resource: string;
	id: string;
	message: string;
}

export interface OperationError {
	__typename: 'OperationError';
	message: string;
	details?: string | null;
}

export interface RateLimitError {
	__typename: 'RateLimitError';
	retryAfterSeconds: number;
	message: string;
}

// Type guards for error types
export function isValidationError(error: unknown): error is ValidationError {
	return (error as ValidationError)?.__typename === 'ValidationError';
}

export function isNotFoundError(error: unknown): error is NotFoundError {
	return (error as NotFoundError)?.__typename === 'NotFoundError';
}

export function isOperationError(error: unknown): error is OperationError {
	return (error as OperationError)?.__typename === 'OperationError';
}

export function isRateLimitError(error: unknown): error is RateLimitError {
	return (error as RateLimitError)?.__typename === 'RateLimitError';
}

// Helper to extract error message from GraphQL errors
export function extractErrorMessage(error: CombinedError | Error | unknown): string {
	// Handle CombinedError from URQL
	if (error && typeof error === 'object' && 'message' in error) {
		const err = error as CombinedError;

		// Check for GraphQL errors
		if (err.graphQLErrors && err.graphQLErrors.length > 0) {
			const firstError = err.graphQLErrors[0];

			// Check if it's a structured error with extensions
			if (firstError.extensions?.code) {
				switch (firstError.extensions.code) {
					case 'VALIDATION_ERROR':
						return firstError.extensions.field
							? `${firstError.extensions.field}: ${firstError.message}`
							: firstError.message;
					case 'NOT_FOUND':
						return firstError.message || 'Resource not found';
					case 'RATE_LIMITED': {
						const retryAfter = firstError.extensions.retryAfterSeconds;
						return retryAfter
							? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
							: 'Rate limit exceeded. Please try again later.';
					}
					default:
						return firstError.message;
				}
			}

			return firstError.message;
		}

		// Check for network errors
		if (err.networkError) {
			return 'Network error. Please check your connection and try again.';
		}

		// Fallback to generic message
		return err.message || 'An unexpected error occurred';
	}

	// Handle standard Error
	if (error instanceof Error) {
		return error.message;
	}

	// Handle string errors
	if (typeof error === 'string') {
		return error;
	}

	// Fallback
	return 'An unexpected error occurred';
}

// Type for mutation result from URQL
interface MutationResult {
	data?: Record<string, unknown>;
	error?: CombinedError;
}

// Helper to handle mutation results with union types
export function handleMutationResult<T>(
	result: MutationResult,
	fieldName: string
): { success: boolean; data?: T; error?: string } {
	if (!result.data || !result.data[fieldName]) {
		// Check for GraphQL errors
		if (result.error) {
			return {
				success: false,
				error: extractErrorMessage(result.error)
			};
		}
		return {
			success: false,
			error: 'No data returned from server'
		};
	}

	const response = result.data[fieldName] as Record<string, unknown>;

	// Check if response is an error type
	if (isValidationError(response)) {
		return {
			success: false,
			error: `${response.field}: ${response.message}`
		};
	}

	if (isNotFoundError(response)) {
		return {
			success: false,
			error: response.message
		};
	}

	if (isOperationError(response)) {
		return {
			success: false,
			error: response.details ? `${response.message}: ${response.details}` : response.message
		};
	}

	if (isRateLimitError(response)) {
		return {
			success: false,
			error: `Rate limit exceeded. Please try again in ${response.retryAfterSeconds} seconds.`
		};
	}

	// Check for success result wrapper (e.g., ImageSuccessResult, AnnotationSuccessResult)
	if ('__typename' in response && (response.__typename as string).endsWith('SuccessResult')) {
		return {
			success: true,
			data: (response as { data: unknown }).data as T
		};
	}

	// Direct data response
	return {
		success: true,
		data: response as T
	};
}

// Helper specifically for delete operations
export function handleDeleteResult(
	result: MutationResult,
	fieldName: string
): { success: boolean; message: string } {
	if (!result.data || !result.data[fieldName]) {
		if (result.error) {
			return {
				success: false,
				message: extractErrorMessage(result.error)
			};
		}
		return {
			success: false,
			message: 'Failed to delete: No response from server'
		};
	}

	const response = result.data[fieldName] as unknown;

	// Handle DeleteResult type
	if (response && typeof response === 'object' && 'deleted' in response && 'message' in response) {
		const deleteResult = response as { deleted: boolean; message: string };
		return {
			success: deleteResult.deleted,
			message: deleteResult.message
		};
	}

	// Fallback for boolean response (legacy)
	if (typeof response === 'boolean') {
		return {
			success: response,
			message: response ? 'Deleted successfully' : 'Failed to delete'
		};
	}

	return {
		success: false,
		message: 'Unexpected response format'
	};
}
