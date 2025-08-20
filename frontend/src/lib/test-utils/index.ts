/**
 * Test utility functions
 * Common utilities for testing across the application
 */
export { render } from 'vitest-browser-svelte';
import type { Locator } from '@vitest/browser/context';
import { page } from '@vitest/browser/context';

/**
 * Helper functions for vitest-browser-svelte API compatibility
 */

/**
 * Trigger a blur event on an element
 */
export async function triggerBlur(element: Locator): Promise<void> {
	// Focus the element first by clicking, then use query to trigger blur
	await element.click();
	const el = await element.query();
	if (el && el instanceof HTMLElement) {
		el.blur();
	}
}

/**
 * Get text content from a locator
 */
export async function getTextContent(element: Locator | null): Promise<string | null> {
	try {
		if (!element) return null;
		const el = await element.query();
		return el?.textContent || null;
	} catch {
		return null;
	}
}

/**
 * Get input value from a locator
 */
export async function getInputValue(element: Locator): Promise<string | null> {
	try {
		const el = await element.query();
		if (el && el instanceof HTMLInputElement) {
			return el.value;
		}
		if (el && el instanceof HTMLTextAreaElement) {
			return el.value;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Find closest element matching a selector
 */
export async function findClosest(element: Locator, selector: string): Promise<Locator | null> {
	try {
		const el = await element.query();
		if (el) {
			const closest = el.closest(selector);
			if (closest) {
				// Return a locator that can find this element by text content
				return page
					.getByRole('generic')
					.filter({ hasText: closest.textContent || '' })
					.first();
			}
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Query by role - equivalent to screen.queryByRole
 */
export function queryByRole(role: string, options?: { name?: string | RegExp }): Locator | null {
	try {
		return page.getByRole(role, options);
	} catch {
		return null;
	}
}

/**
 * Query by text - equivalent to screen.queryByText
 */
export function queryByText(text: string | RegExp): Locator | null {
	try {
		return page.getByText(text);
	} catch {
		return null;
	}
}

/**
 * Query by label text - equivalent to screen.queryByLabelText
 */
export function queryByLabelText(labelText: string | RegExp): Locator | null {
	try {
		return page.getByLabelText(labelText);
	} catch {
		return null;
	}
}

/**
 * Get by label text - equivalent to screen.getByLabelText
 */
export function getByLabelText(labelText: string | RegExp): Locator {
	return page.getByLabelText(labelText);
}

/**
 * Get the closest ancestor element that matches a selector
 */
export function getClosest(element: HTMLElement, selector: string): HTMLElement | null {
	return element.closest(selector);
}

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
