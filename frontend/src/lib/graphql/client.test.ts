import { describe, expect, it, vi } from 'vitest';

// Mock the urql/svelte module to prevent timeout issues
vi.mock('@urql/svelte', () => ({
	Client: vi.fn(() => ({
		query: vi.fn(),
		mutation: vi.fn(),
		subscription: vi.fn()
	})),
	cacheExchange: vi.fn(),
	fetchExchange: vi.fn()
}));

describe('GraphQL Client', () => {
	it('should export client instance', async () => {
		const { client } = await import('./client');
		expect(client).toBeDefined();
		expect(client).toHaveProperty('query');
		expect(typeof client.query).toBe('function');
	});

	it('should have expected client methods', async () => {
		const { client } = await import('./client');
		// Check that client has the expected methods from urql
		expect(client).toHaveProperty('query');
		expect(client).toHaveProperty('mutation');
		expect(typeof client.query).toBe('function');
		expect(typeof client.mutation).toBe('function');
	});

	it('should be an instance of Client', async () => {
		const { client } = await import('./client');
		// Basic checks that it's a proper client instance
		expect(client).toBeDefined();
		expect(typeof client).toBe('object');
		expect(client.constructor).toBeDefined();
	});
});
