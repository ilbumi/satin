import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '$lib/test-utils';
import Toast, { type ToastPosition } from '../Toast.svelte';

describe('Toast', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders when mounted', async () => {
		const screen = render(Toast, {
			message: 'Test message'
		});

		// Need to advance timers to let the component mount
		vi.runAllTimers();

		const alert = screen.getByRole('alert');
		await expect.element(alert).toBeVisible();
	});

	it('renders different toast types correctly', async () => {
		const successToast = render(Toast, {
			type: 'success',
			message: 'Success message'
		});
		vi.runAllTimers();

		const successAlert = successToast.container.querySelector('.bg-green-50');
		await expect.element(successAlert).toBeVisible();

		const errorToast = render(Toast, {
			type: 'error',
			message: 'Error message'
		});
		vi.runAllTimers();

		const errorAlert = errorToast.container.querySelector('.bg-red-50');
		await expect.element(errorAlert).toBeVisible();

		const warningToast = render(Toast, {
			type: 'warning',
			message: 'Warning message'
		});
		vi.runAllTimers();

		const warningAlert = warningToast.container.querySelector('.bg-yellow-50');
		await expect.element(warningAlert).toBeVisible();

		const infoToast = render(Toast, {
			type: 'info',
			message: 'Info message'
		});
		vi.runAllTimers();

		const infoAlert = infoToast.container.querySelector('.bg-blue-50');
		await expect.element(infoAlert).toBeVisible();
	});

	it('renders message and title', async () => {
		const screen = render(Toast, {
			title: 'Toast Title',
			message: 'Toast message'
		});

		vi.runAllTimers();

		await expect.element(screen.getByText('Toast Title')).toBeVisible();
		await expect.element(screen.getByText('Toast message')).toBeVisible();
	});

	it('renders close button when showCloseButton is true', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			showCloseButton: true
		});

		vi.runAllTimers();

		await expect.element(screen.getByLabelText('Close notification')).toBeVisible();
	});

	it('does not render close button when showCloseButton is false', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			showCloseButton: false
		});

		vi.runAllTimers();

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

		vi.runAllTimers();

		const closeButton = screen.getByLabelText('Close notification');
		await closeButton.click();

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('applies correct position classes', async () => {
		const positions: ToastPosition[] = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

		for (const position of positions) {
			const screen = render(Toast, {
				message: 'Test message',
				position
			});

			vi.runAllTimers();

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
		const onclose = vi.fn();
		const screen = render(Toast, {
			message: 'Test message',
			persistent: false,
			duration: 1000,
			onclose
		});

		vi.runAllTimers();

		// Initially visible
		const alert = screen.getByRole('alert');
		await expect.element(alert).toBeVisible();

		// Advance time by duration
		vi.advanceTimersByTime(1000);

		expect(onclose).toHaveBeenCalledOnce();
	});

	it('does not auto-close when persistent is true', async () => {
		const onclose = vi.fn();
		render(Toast, {
			message: 'Test message',
			persistent: true,
			duration: 1000,
			onclose
		});

		vi.runAllTimers();

		// Advance time by duration
		vi.advanceTimersByTime(1000);

		expect(onclose).not.toHaveBeenCalled();
	});

	it('handles hover events without crashing', async () => {
		const screen = render(Toast, {
			message: 'Test message',
			persistent: true // Prevent auto-close during test
		});

		vi.runAllTimers();

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

		vi.runAllTimers();

		const alert = screen.getByRole('alert');
		await expect.element(alert).toHaveAttribute('role', 'alert');
		await expect.element(alert).toHaveAttribute('aria-live', 'polite');
	});
});
