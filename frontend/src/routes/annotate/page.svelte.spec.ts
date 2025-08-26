import { page } from '@vitest/browser/context';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AnnotatePage from './+page.svelte';

// Mock the navigation module since the page redirects
const mockGoto = vi.hoisted(() => vi.fn());
vi.mock('$app/navigation', () => ({
	goto: mockGoto
}));

describe('annotate/+page.svelte', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders page title correctly', async () => {
		render(AnnotatePage);

		// Check that page title is set to "Redirecting... - Satin"
		await expect.poll(() => document.title).toBe('Redirecting... - Satin');
	});

	it('shows loading spinner and redirect message', async () => {
		render(AnnotatePage);

		const spinner = document.querySelector('.animate-spin');
		const message = page.getByText('Redirecting to image selection...');

		expect(spinner).toBeInTheDocument();
		await expect.element(message).toBeInTheDocument();
	});

	it('redirects to images page on mount', async () => {
		render(AnnotatePage);

		// Wait for onMount to execute
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(mockGoto).toHaveBeenCalledWith('/images');
	});
});
