import { vi } from 'vitest';

// Mock GraphQL client
export const mockClient = {
	query: vi.fn(),
	mutation: vi.fn()
};

// Mock query results
export const mockQueryResult = {
	data: null,
	error: null,
	fetching: false
};

export const Client = vi.fn(() => mockClient);

// Reset mocks helper
export const resetMocks = () => {
	vi.clearAllMocks();
	mockClient.query.mockClear();
	mockClient.mutation.mockClear();
};
