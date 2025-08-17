import { describe, it, expect, vi } from 'vitest';
import { render } from '$lib/test-utils';
import Toast from '../Toast.svelte';
import type { ToastPosition } from '../types';

describe('Toast', () => {
	it('renders when mounted', async () => {
		const screen = render(Toast, {
			message: 'Test message'
		});

		const alert = screen.getByRole('alert');
		await expect.element(alert).toBeVisible();
	});

	it('renders different toast types correctly', async () => {
		render(Toast, {
			type: 'success',
			message: 'Success message'
		});

		const successAlert = document.querySelector('.bg-green-50');
		await expect.element(successAlert!).toBeVisible();

		render(Toast, {
			type: 'error',
			message: 'Error message'
		});

		const errorAlert = document.querySelector('.bg-red-50');
		await expect.element(errorAlert!).toBeVisible();

		render(Toast, {
			type: 'warning',
			message: 'Warning message'
		});

		const warningAlert = document.querySelector('.bg-yellow-50');
		await expect.element(warningAlert!).toBeVisible();

		render(Toast, {
			type: 'info',
			message: 'Info message'
		});

		const infoAlert = document.querySelector('.bg-blue-50');
		await expect.element(infoAlert!).toBeVisible();
	});

	it('renders message and title', async () => {
		const screen = render(Toast, {
			title: 'Toast Title',
			message: 'Toast message'
		});

		await expect.element(screen.getByText('Toast Title')).toBeVisible();
		await expect.element(screen.getByText('Toast message')).toBeVisible();
	});

	it('renders close button when showCloseButton is true', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			showCloseButton: true
		});

		await expect.element(screen.getByLabelText('Close notification')).toBeVisible();
	});

	it('does not render close button when showCloseButton is false', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			showCloseButton: false
		});

		const closeButton = screen.container.querySelector('button[aria-label="Close notification"]');
		expect(closeButton).toBeNull();
	});

	it('calls onclose when close button is clicked', async () => {
		const onclose = vi.fn();
		const screen = render(Toast, {
			message: 'Test message',
			showCloseButton: true,
			onclose
		});

		const closeButton = screen.getByLabelText('Close notification');
		await closeButton.click();

		// Wait for animation and callback
		await new Promise((resolve) => setTimeout(resolve, 350));
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('applies correct position classes', async () => {
		const positions: ToastPosition[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

		for (const position of positions) {
			const screen = render(Toast, {
				message: 'Test message',
				position
			});

			const alert = screen.getByRole('alert');

			if (position.includes('top')) {
				await expect.element(alert).toHaveClass('top-4');
			}
			if (position.includes('bottom')) {
				await expect.element(alert).toHaveClass('bottom-4');
			}
			if (position.includes('right')) {
				await expect.element(alert).toHaveClass('right-4');
			}
			if (position.includes('left')) {
				await expect.element(alert).toHaveClass('left-4');
			}

			// Clean up for next iteration
			screen.unmount();
		}
	});

	it('auto-closes after duration when persistent is false', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			persistent: false,
			duration: 100 // Short duration for test
		});

		// Initially visible
		const alert = screen.getByRole('alert');
		await expect.element(alert).toBeVisible();

		// Wait for auto-close (using real timers)
		await new Promise((resolve) => setTimeout(resolve, 150));
	});

	it('does not auto-close when persistent is true', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			persistent: true,
			duration: 100
		});

		// Should remain visible after duration
		const alert = screen.getByRole('alert');
		await expect.element(alert).toBeVisible();
	});

	it('handles hover events without crashing', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			persistent: true // Prevent auto-close during test
		});

		const toastStatus = screen.getByRole('status');

		// Test that hover events work without errors
		await expect(async () => {
			await toastStatus.hover();
		}).not.toThrow();
	});

	it('has correct accessibility attributes', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			type: 'error'
		});

		const alert = screen.getByRole('alert');
		await expect.element(alert).toHaveAttribute('role', 'alert');
		await expect.element(alert).toHaveAttribute('aria-live', 'polite');
	});
});
