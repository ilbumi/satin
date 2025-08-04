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
	it('should render main page components', async () => {
		render(Page);

		// Check for annotation workspace which should be present
		await expect.element(page.getByRole('heading', { name: /annotations/i })).toBeInTheDocument();

		// Check for brand link from navigation
		const brandLink = page.getByRole('link', { name: /satin/i });
		await expect.element(brandLink).toBeInTheDocument();
	});
});
