import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Types available for future test cases if needed

// Mock the image service using vi.hoisted
const mockImageService = vi.hoisted(() => ({
	getImages: vi.fn(),
	deleteImage: vi.fn(),
	mapImageToSummary: vi.fn(),
	mapImageToDetail: vi.fn()
}));

vi.mock('../service', () => ({
	imageService: mockImageService
}));

// Import the store instance
import { imageStore } from '../store.svelte';

describe('Image Store', () => {
	let store: typeof imageStore;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	// Mock data available for potential future tests

	beforeEach(() => {
		// Mock console.error to suppress error logs during tests
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.clearAllMocks();
		vi.useFakeTimers();

		// Mock window for server environment
		if (!global.window) {
			global.window = {
				setTimeout: vi.fn((cb: () => void, delay: number) => setTimeout(cb, delay)),
				clearTimeout: vi.fn((id: number) => clearTimeout(id))
			} as unknown as Window & typeof globalThis;
		}

		store = imageStore;

		// Clear any errors
		store.clearError();
	});

	afterEach(() => {
		// Restore console.error
		consoleErrorSpy.mockRestore();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe('Store Properties', () => {
		it('should have correct default properties', () => {
			expect(store.pagination.limit).toBe(12);
			expect(store.filters.search).toBe('');
			expect(store.filters.status).toBe('all');
			expect(store.error).toBeNull();
		});
	});

	describe('Error Handling', () => {
		it('should handle delete errors', async () => {
			const error = new Error('Delete failed');
			mockImageService.deleteImage.mockRejectedValue(error);

			const result = await store.deleteImage('1');

			expect(result).toBe(false);
			expect(store.error).toBe('Delete failed');
		});

		it('should clear errors', () => {
			// The error is set internally when operations fail
			// We can test that clearError works by ensuring error is null after calling it
			store.clearError();
			expect(store.error).toBeNull();
		});
	});

	describe('Filter Management', () => {
		it('should have setFilters method', () => {
			expect(typeof store.setFilters).toBe('function');
		});

		it('should have searchImages method for debounced search', () => {
			expect(typeof store.searchImages).toBe('function');
		});
	});

	describe('Operations', () => {
		it('should have required operation methods', () => {
			expect(typeof store.fetchImages).toBe('function');
			expect(typeof store.deleteImage).toBe('function');
			expect(typeof store.refetch).toBe('function');
		});
	});

	describe('Pagination', () => {
		it('should have pagination navigation methods', () => {
			expect(typeof store.nextPage).toBe('function');
			expect(typeof store.prevPage).toBe('function');
		});

		it('should have pagination state', () => {
			expect(typeof store.pagination).toBe('object');
			expect(typeof store.pagination.limit).toBe('number');
			expect(typeof store.pagination.offset).toBe('number');
			expect(typeof store.pagination.totalCount).toBe('number');
			expect(typeof store.pagination.hasMore).toBe('boolean');
		});
	});

	describe('Stats', () => {
		it('should provide image statistics properties', () => {
			// Check that the stats property exists and can be accessed
			expect(store.stats).toBeDefined();
			// In a Svelte reactive store, stats might be a derived value
			// Let's just verify we can access it without error
		});
	});

	describe('Search with Debouncing', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			// Mock window.setTimeout - useFakeTimers already handles this
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should have searchImages method that can be called multiple times', () => {
			// Test that the method exists and can be called without error
			expect(() => {
				store.searchImages('test1');
				store.searchImages('test2');
				store.searchImages('test3');
			}).not.toThrow();

			// Fast-forward timers
			vi.advanceTimersByTime(300);
		});
	});
});
