/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Make vi globally available
(globalThis as unknown as { vi: typeof vi }).vi = vi;

// Mock console methods to suppress warnings and logs in tests
beforeAll(() => {
	// Keep console.error for actual test failures, but suppress service logs
	const originalError = console.error;
	const originalWarn = console.warn;
	const originalLog = console.log;

	vi.spyOn(console, 'error').mockImplementation((...args) => {
		// Only suppress service-related errors in test scenarios, allow test errors through
		const message = args[0]?.toString() || '';
		if (
			message.includes('Store.') ||
			message.includes('Service.') ||
			(message.includes('Failed to fetch') && !message.includes('toPromise')) ||
			message.includes('GraphQL Error') ||
			message.includes('Network error occurred')
		) {
			return; // Suppress
		}
		originalError(...args); // Allow through
	});

	vi.spyOn(console, 'warn').mockImplementation((...args) => {
		const message = args[0]?.toString() || '';
		if (message.includes('MSW:') || message.includes('Some image additions failed')) {
			return; // Suppress
		}
		originalWarn(...args); // Allow through
	});

	vi.spyOn(console, 'log').mockImplementation((...args) => {
		const message = args[0]?.toString() || '';
		if (
			message.includes('🔶 MSW:') ||
			message.includes('Environment validated') ||
			message.includes('🧪 Running GraphQL') ||
			message.includes('Navigate to')
		) {
			return; // Suppress
		}
		originalLog(...args); // Allow through
	});
});

afterEach(() => {
	cleanup();
});
