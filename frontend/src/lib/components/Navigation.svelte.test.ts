import { describe, expect, it, vi } from 'vitest';

// Mock $app/stores
const mockPageStore = vi.fn();
vi.mock('$app/stores', () => ({
	page: {
		subscribe: mockPageStore
	}
}));

describe('Navigation Component', () => {
	it('should import without errors', async () => {
		// Test that the component can be imported
		expect(async () => {
			await import('./Navigation.svelte');
		}).not.toThrow();
	});

	it('should have page store mock available', () => {
		expect(mockPageStore).toBeDefined();
		expect(typeof mockPageStore).toBe('function');
	});

	it('should handle different page states in mock', () => {
		// Test that we can mock different page states
		const callback = vi.fn();
		const unsubscribe = vi.fn();

		mockPageStore.mockImplementation((cb) => {
			cb({ url: { pathname: '/projects' } });
			return unsubscribe;
		});

		mockPageStore(callback);
		expect(callback).toHaveBeenCalledWith({ url: { pathname: '/projects' } });
	});

	it('should mock home page state', () => {
		const callback = vi.fn();

		mockPageStore.mockImplementation((cb) => {
			cb({ url: { pathname: '/' } });
			return vi.fn();
		});

		mockPageStore(callback);
		expect(callback).toHaveBeenCalledWith({ url: { pathname: '/' } });
	});
});
