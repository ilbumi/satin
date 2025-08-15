/**
 * Test utility functions
 * Common utilities for testing across the application
 */
export { render } from 'vitest-browser-svelte';

/**
 * Wait for a specified amount of time (useful for testing async operations)
 */
export function waitFor(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock function that tracks calls
 */
export function createMockFn<T extends (...args: unknown[]) => unknown>(
	implementation?: T
): T & { calls: Parameters<T>[]; callCount: number } {
	const calls: Parameters<T>[] = [];

	const mockFn = ((...args: Parameters<T>) => {
		calls.push(args);
		return implementation?.(...args);
	}) as T & { calls: Parameters<T>[]; callCount: number };

	Object.defineProperty(mockFn, 'calls', {
		get: () => calls
	});

	Object.defineProperty(mockFn, 'callCount', {
		get: () => calls.length
	});

	return mockFn;
}

/**
 * Mock environment variables for testing
 */
export function mockEnv(envVars: Partial<ImportMetaEnv>): void {
	Object.assign(import.meta.env, envVars);
}

/**
 * Create a test wrapper for async functions that handles errors
 */
export async function expectAsync<T>(fn: () => Promise<T>): Promise<{ result?: T; error?: Error }> {
	try {
		const result = await fn();
		return { result };
	} catch (error) {
		return { error: error as Error };
	}
}

/**
 * Generate a random string for testing
 */
export function randomString(length: number = 8): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Generate test data for various entities
 */
export const testData = {
	project: {
		id: () => `project-${randomString()}`,
		name: () => `Test Project ${randomString(4)}`,
		description: () => `Test project description ${randomString()}`
	},

	image: {
		id: () => `image-${randomString()}`,
		filename: () => `test-image-${randomString()}.jpg`,
		url: () => `http://localhost:8000/images/test-${randomString()}.jpg`
	},

	task: {
		id: () => `task-${randomString()}`,
		title: () => `Test Task ${randomString(4)}`,
		status: () => 'pending' as const
	}
};
