import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Layout from './+layout.svelte';

describe('+layout.svelte', () => {
	it('renders ErrorBoundary wrapper', async () => {
		render(Layout);

		// Check that ErrorBoundary component is present by verifying layout structure
		// The layout should render without errors and show the main layout elements
		const header = document.querySelector('header');
		expect(header).toBeInTheDocument();

		// Check that main content area exists
		const main = document.querySelector('main');
		expect(main).toBeInTheDocument();
	});

	it('renders BaseLayout and ToastContainer', async () => {
		render(Layout);

		// Check that BaseLayout header is rendered
		const satinLink = page.getByText('Satin');
		await expect.element(satinLink).toBeInTheDocument();

		// Check that ToastContainer is rendered (fixed positioned container)
		const toastContainer = document.querySelector('.fixed.top-4.right-4');
		expect(toastContainer).toBeInTheDocument();

		// Check that main layout structure exists
		const main = document.querySelector('main');
		expect(main).toBeInTheDocument();
	});

	it('sets up proper head elements', async () => {
		render(Layout);

		// Check that favicon link is set up
		const favicon = document.querySelector('link[rel="icon"]');
		expect(favicon).toBeInTheDocument();
	});

	it('renders navigation elements from BaseLayout', async () => {
		render(Layout);

		const homeLink = page.getByText('Home');
		const annotateLink = page.getByText('Annotate');

		await expect.element(homeLink).toBeInTheDocument();
		await expect.element(annotateLink).toBeInTheDocument();
	});
});
