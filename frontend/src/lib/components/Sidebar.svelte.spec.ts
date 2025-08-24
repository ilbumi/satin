import { page } from '@vitest/browser/context';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Sidebar from './Sidebar.svelte';

describe('Sidebar', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'innerWidth', {
			writable: true,
			configurable: true,
			value: 1024
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders sidebar with default props', async () => {
		render(Sidebar);

		const sidebar = document.querySelector('.z-50.flex.flex-col');
		expect(sidebar).toBeInTheDocument();
		expect(sidebar).toHaveClass(/w-80/);
		expect(sidebar).not.toHaveClass(/w-12/);

		// Check toggle button is present
		const toggleButton = document.querySelector('button');
		expect(toggleButton).toBeInTheDocument();
	});

	it('renders collapsed sidebar', async () => {
		render(Sidebar, {
			isCollapsed: true
		});

		const sidebar = document.querySelector('.z-50.flex.flex-col');
		expect(sidebar).toHaveClass(/w-12/);

		// Check that toggle button is still present even when collapsed
		const toggleButton = document.querySelector('button');
		expect(toggleButton).toBeInTheDocument();
	});

	it('shows collapsed state indicators when collapsed', async () => {
		render(Sidebar, {
			isCollapsed: true
		});

		const indicators = document.querySelectorAll('.h-3.w-3.rounded-full');
		expect(indicators.length).toBe(3);

		const blueIndicator = document.querySelector('.bg-blue-500');
		const greenIndicator = document.querySelector('.bg-green-500');
		const purpleIndicator = document.querySelector('.bg-purple-500');

		expect(blueIndicator).toBeInTheDocument();
		expect(greenIndicator).toBeInTheDocument();
		expect(purpleIndicator).toBeInTheDocument();
	});

	it('calls onToggle when toggle button is clicked', async () => {
		const onToggle = vi.fn();
		render(Sidebar, {
			onToggle
		});

		const toggleButton = page.getByRole('button', { name: 'Collapse sidebar' });
		await toggleButton.click();

		expect(onToggle).toHaveBeenCalledOnce();
	});

	it('shows correct aria-label for collapsed state', async () => {
		render(Sidebar, {
			isCollapsed: true
		});

		const toggleButton = page.getByRole('button', { name: 'Expand sidebar' });
		await expect.element(toggleButton).toBeInTheDocument();
	});

	it('applies left position styling', async () => {
		render(Sidebar, {
			position: 'left'
		});

		const sidebar = document.querySelector('.z-50.flex.flex-col');
		expect(sidebar).toHaveClass(/border-r/);
	});

	it('applies right position styling by default', async () => {
		render(Sidebar);

		const sidebar = document.querySelector('.z-50.flex.flex-col');
		expect(sidebar).toHaveClass(/border-l/);
	});

	it('rotates toggle icon when collapsed', async () => {
		render(Sidebar, {
			isCollapsed: true
		});

		const toggleIcon = document.querySelector('svg.h-4.w-4');
		expect(toggleIcon).toHaveClass(/rotate-180/);
	});

	it('does not rotate toggle icon when expanded', async () => {
		render(Sidebar, {
			isCollapsed: false
		});

		const toggleIcon = document.querySelector('svg.h-4.w-4');
		expect(toggleIcon).not.toHaveClass(/rotate-180/);
	});
});
