/**
 * Retry utility with exponential backoff for robust error handling
 * Provides configurable retry mechanisms for network operations
 */

export interface RetryOptions {
	maxAttempts?: number;
	initialDelay?: number;
	maxDelay?: number;
	backoffFactor?: number;
	retryIf?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
	maxAttempts: 3,
	initialDelay: 1000, // 1 second
	maxDelay: 10000, // 10 seconds
	backoffFactor: 2,
	retryIf: (error: unknown) => {
		// Retry on network errors, but not on validation or user errors
		const err = error as { networkError?: unknown; message?: string; code?: number };
		if (err?.networkError) return true;
		if (err?.message?.includes('fetch')) return true;
		if (err?.message?.includes('network')) return true;
		if (err?.code && err.code >= 500) return true; // Server errors
		return false;
	}
};

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
	attempt: number,
	initialDelay: number,
	backoffFactor: number,
	maxDelay: number
): number {
	const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt - 1);
	const delayWithJitter = exponentialDelay * (0.5 + Math.random() * 0.5); // Add 0-50% jitter
	return Math.min(delayWithJitter, maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
	let lastError: unknown;

	for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;

			// Check if we should retry this error
			if (!config.retryIf(error)) {
				throw error;
			}

			// If this was the last attempt, throw the error
			if (attempt === config.maxAttempts) {
				throw error;
			}

			// Calculate delay and wait before retrying
			const delay = calculateDelay(
				attempt,
				config.initialDelay,
				config.backoffFactor,
				config.maxDelay
			);

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, errorMessage);
			await sleep(delay);
		}
	}

	// This should never be reached, but TypeScript requires it
	throw lastError;
}

/**
 * Retry wrapper specifically for GraphQL operations
 */
export async function retryGraphQLOperation<T>(
	operation: () => Promise<T>,
	_operationName: string
): Promise<T> {
	return retryWithBackoff(operation, {
		maxAttempts: 3,
		initialDelay: 1000,
		retryIf: (error: unknown) => {
			// Retry on network errors and server errors, but not client errors
			const err = error as {
				networkError?: unknown;
				graphQLErrors?: { extensions?: { code?: number } }[];
			};
			if (err?.networkError) return true;
			if (err?.graphQLErrors?.some((e) => e.extensions?.code && e.extensions.code >= 500))
				return true;
			return false;
		}
	});
}

/**
 * Retry wrapper for store operations
 */
export async function retryStoreOperation<T>(
	operation: () => Promise<T>,
	_storeName: string
): Promise<T> {
	return retryWithBackoff(operation, {
		maxAttempts: 2, // Less aggressive retries for store operations
		initialDelay: 500,
		retryIf: (error: unknown) => {
			// Only retry on clear network issues
			const err = error as { networkError?: unknown; message?: string };
			return Boolean(err?.networkError) || Boolean(err?.message?.includes('fetch'));
		}
	});
}

/**
 * Circuit breaker pattern for preventing cascade failures
 */
export class CircuitBreaker {
	private failures = 0;
	private lastFailureTime = 0;
	private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

	constructor(
		private failureThreshold = 5,
		private resetTimeout = 30000 // 30 seconds
	) {}

	async execute<T>(operation: () => Promise<T>): Promise<T> {
		if (this.state === 'OPEN') {
			if (Date.now() - this.lastFailureTime < this.resetTimeout) {
				throw new Error('Circuit breaker is OPEN');
			} else {
				this.state = 'HALF_OPEN';
			}
		}

		try {
			const result = await operation();
			this.onSuccess();
			return result;
		} catch (error) {
			this.onFailure();
			throw error;
		}
	}

	private onSuccess(): void {
		this.failures = 0;
		this.state = 'CLOSED';
	}

	private onFailure(): void {
		this.failures++;
		this.lastFailureTime = Date.now();

		if (this.failures >= this.failureThreshold) {
			this.state = 'OPEN';
		}
	}

	get isOpen(): boolean {
		return this.state === 'OPEN';
	}
}

/**
 * Global circuit breaker for GraphQL operations
 */
export const graphqlCircuitBreaker = new CircuitBreaker(3, 15000); // 3 failures, 15s timeout
