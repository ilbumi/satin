import { page } from '@vitest/browser/context';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';
import { writable } from 'svelte/store';

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
		subscribe: writable({
			currentTool: 'select',
			imageUrl: '',
			annotations: [],
			selectedAnnotationId: null
		}).subscribe,
		setTool: vi.fn(),
		setImageUrl: vi.fn(),
		createAnnotation: vi.fn(),
		selectAnnotation: vi.fn(),
		deleteAnnotation: vi.fn(),
		updateAnnotation: vi.fn(),
		loadDemoImage: vi.fn()
	}
}));

describe('/+page.svelte', () => {
	it('should render main page components', async () => {
		render(Page);

		// Check for demo button which should be present
		const demoButton = page.getByRole('button', { name: /load demo image/i });
		await expect.element(demoButton).toBeInTheDocument();

		// Check for brand link from navigation
		const brandLink = page.getByRole('link', { name: /satin/i });
		await expect.element(brandLink).toBeInTheDocument();
	});
});
