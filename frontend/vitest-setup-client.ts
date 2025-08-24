/// <reference types="@vitest/browser/matchers" />
/// <reference types="@vitest/browser/providers/playwright" />

import { vi } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

vi.mock('$app/stores', () => {
	const mockPageStore = {
		subscribe: vi.fn((callback) => {
			callback({
				url: new URL('http://localhost:5173/'),
				params: {},
				route: { id: null },
				status: 200,
				error: null,
				data: {},
				form: null,
				state: {}
			});
			return vi.fn();
		}),
		url: new URL('http://localhost:5173/'),
		params: {},
		route: { id: null },
		status: 200,
		error: null,
		data: {},
		form: null,
		state: {}
	};

	return {
		page: mockPageStore,
		navigating: {
			subscribe: vi.fn(() => vi.fn())
		},
		updated: {
			subscribe: vi.fn(() => vi.fn()),
			check: vi.fn()
		}
	};
});

// Mock GraphQL client
vi.mock('$lib/graphql/client', () => ({
	client: {
		query: vi.fn(),
		mutation: vi.fn(),
		subscription: vi.fn()
	}
}));

vi.mock('@urql/svelte', () => ({
	setContextClient: vi.fn(),
	getContextClient: vi.fn(),
	query: vi.fn(),
	mutation: vi.fn(),
	subscription: vi.fn()
}));
