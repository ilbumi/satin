import { page } from '@vitest/browser/context';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AnnotatePage from './+page.svelte';

// Mock the navigation module since the page redirects
const mockGoto = vi.hoisted(() => vi.fn());
vi.mock('$app/navigation', () => ({
	goto: mockGoto
}));

// Mock URQL client and operations
const mockQueryStore = vi.hoisted(() => vi.fn());
const mockGetContextClient = vi.hoisted(() => vi.fn());

vi.mock('@urql/svelte', () => ({
	queryStore: mockQueryStore,
	getContextClient: mockGetContextClient
}));

vi.mock('$lib/graphql/operations/images', () => ({
	GET_IMAGES_BY_STATUS: 'mock-query'
}));

describe('annotate/+page.svelte', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetContextClient.mockReturnValue({});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders loading state initially', async () => {
		// Mock a query that is still fetching
		const mockSubscribe = vi.fn();
		mockQueryStore.mockReturnValue({ subscribe: mockSubscribe });

		render(AnnotatePage);

		// Check loading state
		const spinner = document.querySelector('.animate-spin');
		const message = page.getByText('Finding a random image to annotate...');

		expect(spinner).toBeInTheDocument();
		await expect.element(message).toBeInTheDocument();
	});

	it('shows error state when no images available', async () => {
		// Mock a query that returns no images
		const mockSubscribe = vi.fn((callback) => {
			setTimeout(() => {
				callback({ fetching: false, data: { imagesByStatus: [] }, error: null });
			}, 0);
			return () => {};
		});
		mockQueryStore.mockReturnValue({ subscribe: mockSubscribe });

		render(AnnotatePage);

		// Wait for the query to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		const errorMessage = page.getByText('No Images Ready');
		await expect.element(errorMessage).toBeInTheDocument();
	});

	it('redirects to random image annotation page when images are available', async () => {
		const mockImages = [
			{ id: 'image-1', url: 'https://example.com/image1.jpg' },
			{ id: 'image-2', url: 'https://example.com/image2.jpg' }
		];

		// Mock a query that returns images
		const mockSubscribe = vi.fn((callback) => {
			setTimeout(() => {
				callback({ fetching: false, data: { imagesByStatus: mockImages }, error: null });
			}, 0);
			return () => {};
		});
		mockQueryStore.mockReturnValue({ subscribe: mockSubscribe });

		render(AnnotatePage);

		// Wait for the query to complete and redirect
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Should redirect to one of the images
		expect(mockGoto).toHaveBeenCalledWith(expect.stringMatching(/^\/annotate\/(image-1|image-2)$/));
	});
});
