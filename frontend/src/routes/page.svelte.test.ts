import { page } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

// Mock $app/stores for Navigation component
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((callback) => {
			callback({
				url: {
					pathname: '/'
				}
			});
			return () => {}; // unsubscribe function
		})
	}
}));

// Mock $app/navigation to prevent navigation errors
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock annotationStore
vi.mock('$lib/stores/annotationStore', () => ({
	annotationStore: {
		subscribe: vi.fn((callback) => {
			callback({
				currentTool: 'select',
				imageUrl: '',
				annotations: [],
				selectedAnnotationId: null
			});
			return () => {}; // unsubscribe function
		}),
		setTool: vi.fn(),
		setImageUrl: vi.fn(),
		createAnnotation: vi.fn(),
		selectAnnotation: vi.fn(),
		deleteAnnotation: vi.fn(),
		updateAnnotation: vi.fn()
	}
}));

describe('/+page.svelte', () => {
	it('should render redirect page components', async () => {
		render(Page);

		// Check for redirect loading message
		await expect.element(page.getByText(/redirecting to projects/i)).toBeInTheDocument();

		// Check for loading redirect container
		const loadingContainer = document.querySelector('.loading-redirect');
		expect(loadingContainer).toBeInTheDocument();
	});
});
