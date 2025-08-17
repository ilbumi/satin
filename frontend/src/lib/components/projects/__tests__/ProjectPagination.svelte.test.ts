import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '$lib/test-utils';
import TestProjectPagination from './TestProjectPagination.svelte';
import { resetMockCounter } from '$lib/features/projects/__tests__/mocks';

describe('ProjectPagination', () => {
	beforeEach(() => {
		resetMockCounter();
	});

	it('does not render when totalCount is 0', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 0,
			hasMore: false
		});

		// Pagination should not be visible when no items
		const buttons = screen.container.querySelectorAll('button');
		expect(buttons.length).toBe(0);
	});

	it('renders pagination controls when totalCount > 0', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 25,
			hasMore: true
		});

		// Should show navigation buttons
		// Test desktop version specifically to avoid multiple button conflicts
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		expect(desktopContainer).toBeTruthy();

		// Check for buttons containing "Previous" and "Next" text
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const prevBtn = buttons.find((btn) => btn.textContent?.includes('Previous'));
		const nextBtn = buttons.find((btn) => btn.textContent?.includes('Next'));
		expect(prevBtn).toBeTruthy();
		expect(nextBtn).toBeTruthy();
	});

	it('shows correct item range and page info', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 25,
			hasMore: true
		});

		// Should show item range (desktop view)
		await expect.element(screen.getByText('Showing')).toBeVisible();
		await expect.element(screen.getByText(/Showing.*1.*to.*10.*of.*25/)).toBeVisible(); // complete range text

		// Should show page info
		await expect.element(screen.getByText('Page 1 of 3')).toBeVisible();
	});

	it('calculates correct item range for middle page', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 10, // Second page
			totalCount: 25,
			hasMore: true
		});

		// Should show correct range for second page
		await expect.element(screen.getByText(/Showing.*11.*to.*20/)).toBeVisible(); // range text
		await expect.element(screen.getByText('Page 2 of 3')).toBeVisible();
	});

	it('calculates correct item range for last page', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 20, // Third page
			totalCount: 25,
			hasMore: false
		});

		// Should show correct range for last page
		await expect.element(screen.getByText(/Showing.*21.*to.*25/)).toBeVisible(); // range text
		await expect.element(screen.getByText('Page 3 of 3')).toBeVisible();
	});

	it('disables previous button on first page', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 25,
			hasMore: true
		});

		// Previous button should be disabled on first page (check desktop version)
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const prevBtn = buttons.find((btn) => btn.textContent?.includes('Previous'));
		expect(prevBtn?.disabled).toBe(true);
	});

	it('enables previous button on subsequent pages', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 10,
			totalCount: 25,
			hasMore: true
		});

		// Previous button should be enabled on page 2 (check desktop version)
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const prevBtn = buttons.find((btn) => btn.textContent?.includes('Previous'));
		expect(prevBtn?.disabled).toBe(false);
	});

	it('disables next button when hasMore is false', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 20,
			totalCount: 25,
			hasMore: false
		});

		// Next buttons should be disabled on last page
		// Check desktop version for next button
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const nextBtn = buttons.find((btn) => btn.textContent?.includes('Next'));
		expect(nextBtn?.disabled).toBe(true);
	});

	it('enables next button when hasMore is true', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 25,
			hasMore: true
		});

		// Next buttons should be enabled when more pages available
		// Check desktop version for next button
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const nextBtn = buttons.find((btn) => btn.textContent?.includes('Next'));
		expect(nextBtn?.disabled).toBe(false);
	});

	it('disables all buttons when loading', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 10,
			totalCount: 25,
			hasMore: true,
			loading: true
		});

		// All buttons should be disabled during loading (check desktop version)
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const prevBtn = buttons.find((btn) => btn.textContent?.includes('Previous'));
		const nextBtn = buttons.find((btn) => btn.textContent?.includes('Next'));
		expect(prevBtn?.disabled).toBe(true);
		expect(nextBtn?.disabled).toBe(true);
	});

	it('calls onNext when next button clicked', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 25,
			hasMore: true
		});

		const nextButton = (() => {
			const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
			const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
			return buttons.find((btn) => btn.textContent?.includes('Next')) as HTMLButtonElement;
		})();
		await nextButton.click();

		await expect.element(screen.getByTestId('next-called')).toHaveTextContent('true');
		await expect.element(screen.getByTestId('next-call-count')).toHaveTextContent('1');
	});

	it('calls onPrev when previous button clicked', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 10,
			totalCount: 25,
			hasMore: true
		});

		const prevButton = (() => {
			const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
			const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
			return buttons.find((btn) => btn.textContent?.includes('Previous')) as HTMLButtonElement;
		})();
		await prevButton.click();

		await expect.element(screen.getByTestId('prev-called')).toHaveTextContent('true');
		await expect.element(screen.getByTestId('prev-call-count')).toHaveTextContent('1');
	});

	it('handles single page correctly', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 5, // Less than limit
			hasMore: false
		});

		// Should show correct range
		await expect.element(screen.getByText(/Showing.*1.*to.*5/)).toBeVisible(); // range text
		await expect.element(screen.getByText('Page 1 of 1')).toBeVisible();

		// Both buttons should be disabled
		// Check desktop version for both buttons
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const prevBtn = buttons.find((btn) => btn.textContent?.includes('Previous'));
		const nextBtn = buttons.find((btn) => btn.textContent?.includes('Next'));
		expect(prevBtn?.disabled).toBe(true);
		expect(nextBtn?.disabled).toBe(true);
	});

	it('handles exact page boundary correctly', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 10, // Exactly one page
			hasMore: false
		});

		// Should show correct range
		await expect.element(screen.getByText(/Showing.*1.*to.*10/)).toBeVisible(); // range text
		await expect.element(screen.getByText('Page 1 of 1')).toBeVisible();

		// Next button should be disabled
		// Check desktop version for next button
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const nextBtn = buttons.find((btn) => btn.textContent?.includes('Next'));
		expect(nextBtn?.disabled).toBe(true);
	});

	it('shows mobile and desktop versions', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 0,
			totalCount: 25,
			hasMore: true
		});

		// Should have both mobile and desktop versions
		// Mobile version: simple Previous/Next buttons
		const mobileContainer = screen.container.querySelector('.sm\\:hidden');
		expect(mobileContainer).toBeTruthy();

		// Desktop version: detailed pagination info
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		expect(desktopContainer).toBeTruthy();

		// Should have Previous/Next buttons visible
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const prevBtn = buttons.find((btn) => btn.textContent?.includes('Previous'));
		const nextBtn = buttons.find((btn) => btn.textContent?.includes('Next'));
		expect(prevBtn).toBeTruthy();
		expect(nextBtn).toBeTruthy();
	});

	it('handles large offset correctly', async () => {
		const screen = render(TestProjectPagination, {
			limit: 5,
			offset: 95, // Page 20
			totalCount: 100,
			hasMore: false
		});

		// Should show correct range for last page
		await expect.element(screen.getByText('Showing')).toBeVisible();
		await expect.element(screen.getByText('96')).toBeVisible(); // start item
		await expect.element(screen.getByText(/100.*projects/)).toBeVisible(); // end item with context
		await expect.element(screen.getByText('Page 20 of 20')).toBeVisible();
	});

	it('handles different page sizes correctly', async () => {
		const screen = render(TestProjectPagination, {
			limit: 25,
			offset: 0,
			totalCount: 100,
			hasMore: true
		});

		// Should show correct range for larger page size
		await expect.element(screen.getByText('Showing')).toBeVisible();
		await expect.element(screen.getByText(/Showing.*1.*to.*25/)).toBeVisible(); // item range with context
		await expect.element(screen.getByText('Page 1 of 4')).toBeVisible();
	});

	it('handles clicking multiple times', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 10,
			totalCount: 50,
			hasMore: true
		});

		// Get desktop buttons to avoid multiple element conflicts
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const nextButton = buttons.find((btn) =>
			btn.textContent?.includes('Next')
		) as HTMLButtonElement;
		const prevButton = buttons.find((btn) =>
			btn.textContent?.includes('Previous')
		) as HTMLButtonElement;

		// Click next multiple times
		await nextButton.click();
		await nextButton.click();

		await expect.element(screen.getByTestId('next-call-count')).toHaveTextContent('2');

		// Click previous multiple times
		await prevButton.click();
		await prevButton.click();

		await expect.element(screen.getByTestId('prev-call-count')).toHaveTextContent('2');
	});

	it('has proper accessibility structure', async () => {
		const screen = render(TestProjectPagination, {
			limit: 10,
			offset: 10,
			totalCount: 50,
			hasMore: true
		});

		// Buttons should be properly labeled and accessible (check desktop version)
		const desktopContainer = screen.container.querySelector('.hidden.sm\\:flex');
		expect(desktopContainer).toBeTruthy();
		const buttons = Array.from(desktopContainer?.querySelectorAll('button') || []);
		const prevBtn = buttons.find((btn) => btn.textContent?.includes('Previous'));
		const nextBtn = buttons.find((btn) => btn.textContent?.includes('Next'));
		expect(prevBtn).toBeTruthy();
		expect(nextBtn).toBeTruthy();

		// Page information should be accessible
		await expect.element(screen.getByText(/Showing/)).toBeVisible();
		await expect.element(screen.getByText(/Page \d+ of \d+/)).toBeVisible();
	});
});
