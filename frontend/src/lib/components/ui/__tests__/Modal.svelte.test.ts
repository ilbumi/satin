import { describe, it, expect, vi } from 'vitest';
import { render } from '$lib/test-utils';
import TestModal from './TestModal.svelte';

describe('Modal', () => {
	it('renders when open is true', async () => {
		const screen = render(TestModal, {
			open: true,
			content: 'Modal content'
		});

		const dialog = screen.getByRole('dialog');
		await expect.element(dialog).toBeVisible();
	});

	it('does not render when open is false', async () => {
		const screen = render(TestModal, {
			open: false,
			content: 'Modal content'
		});

		const dialog = screen.container.querySelector('[role="dialog"]');
		expect(dialog).toBeNull();
	});

	it('renders with title', async () => {
		const screen = render(TestModal, {
			open: true,
			title: 'Test Modal',
			content: 'Modal content'
		});

		await expect.element(screen.getByText('Test Modal')).toBeVisible();
	});

	it('renders with custom header', async () => {
		const screen = render(TestModal, {
			open: true,
			headerContent: 'Custom Header',
			content: 'Modal content'
		});

		await expect.element(screen.getByText('Custom Header')).toBeVisible();
	});

	it('renders with footer', async () => {
		const screen = render(TestModal, {
			open: true,
			footerContent: 'Modal Footer',
			content: 'Modal content'
		});

		await expect.element(screen.getByText('Modal Footer')).toBeVisible();
	});

	it('renders close button by default', async () => {
		const screen = render(TestModal, {
			open: true,
			content: 'Modal content'
		});

		await expect.element(screen.getByLabelText('Close modal')).toBeVisible();
	});

	it('hides close button when showCloseButton is false', async () => {
		const screen = render(TestModal, {
			open: true,
			showCloseButton: false,
			content: 'Modal content'
		});

		const closeButton = screen.container.querySelector('[aria-label="Close modal"]');
		expect(closeButton).toBeNull();
	});

	it('calls onclose when close button is clicked', async () => {
		const onclose = vi.fn();
		const screen = render(TestModal, {
			open: true,
			onclose,
			content: 'Modal content'
		});

		const closeButton = screen.getByLabelText('Close modal');
		await closeButton.click();

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('applies correct size classes', async () => {
		const smallModal = render(TestModal, {
			open: true,
			size: 'sm',
			content: 'Small modal'
		});
		await expect.element(smallModal.getByRole('dialog')).toHaveClass('max-w-md');

		const largeModal = render(TestModal, {
			open: true,
			size: 'lg',
			content: 'Large modal'
		});
		await expect.element(largeModal.getByRole('dialog')).toHaveClass('max-w-2xl');

		const xlModal = render(TestModal, {
			open: true,
			size: 'xl',
			content: 'XL modal'
		});
		await expect.element(xlModal.getByRole('dialog')).toHaveClass('max-w-4xl');
	});

	it('has correct aria attributes', async () => {
		const screen = render(TestModal, {
			open: true,
			title: 'Test Modal',
			content: 'Modal content'
		});

		const dialog = screen.getByRole('dialog');
		await expect.element(dialog).toHaveAttribute('aria-labelledby');
	});

	// Note: Testing focus trap, escape key, and backdrop click would require
	// more complex setup with jsdom and focus simulation, which is typically
	// done in E2E tests rather than unit tests
});
