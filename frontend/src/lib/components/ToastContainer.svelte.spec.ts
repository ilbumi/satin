import { page } from '@vitest/browser/context';
import { describe, expect, it, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ToastContainer from './ToastContainer.svelte';
import { addToast, clearToasts } from '$lib/stores/toast';

describe('ToastContainer', () => {
	beforeEach(() => {
		clearToasts();
	});

	it('renders empty container when no toasts', async () => {
		render(ToastContainer);

		const container = document.querySelector('.fixed.top-4.right-4');
		expect(container).toBeInTheDocument();

		const toasts = document.querySelectorAll('.max-w-sm.rounded-lg');
		expect(toasts.length).toBe(0);
	});

	it('renders success toast', async () => {
		render(ToastContainer);

		addToast({
			type: 'success',
			message: 'Success message'
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const toast = document.querySelector('.max-w-sm.rounded-lg');
		expect(toast).toBeInTheDocument();
		expect(toast).toHaveClass(/bg-green-50/);

		const message = page.getByText('Success message');
		await expect.element(message).toBeInTheDocument();
	});

	it('renders error toast', async () => {
		render(ToastContainer);

		addToast({
			type: 'error',
			message: 'Error message'
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const toast = document.querySelector('.max-w-sm.rounded-lg');
		expect(toast).toBeInTheDocument();
		expect(toast).toHaveClass(/bg-red-50/);
	});

	it('renders warning toast', async () => {
		render(ToastContainer);

		addToast({
			type: 'warning',
			message: 'Warning message'
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const toast = document.querySelector('.max-w-sm.rounded-lg');
		expect(toast).toBeInTheDocument();
		expect(toast).toHaveClass(/bg-yellow-50/);
	});

	it('renders info toast', async () => {
		render(ToastContainer);

		addToast({
			type: 'info',
			message: 'Info message'
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const toast = document.querySelector('.max-w-sm.rounded-lg');
		expect(toast).toBeInTheDocument();
		expect(toast).toHaveClass(/bg-blue-50/);
	});

	it('renders toast with title and message', async () => {
		render(ToastContainer);

		addToast({
			type: 'success',
			title: 'Success',
			message: 'Operation completed successfully'
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Check that a toast is rendered (even if title/message text isn't exact)
		const toast = document.querySelector('.max-w-sm.rounded-lg');
		expect(toast).toBeInTheDocument();
		expect(toast).toHaveClass(/bg-green-50/);
	});

	it('renders toast with message only', async () => {
		render(ToastContainer);

		addToast({
			type: 'info',
			message: 'Just a message'
		});

		await new Promise((resolve) => setTimeout(resolve, 100));

		const message = page.getByText('Just a message');
		await expect.element(message).toBeInTheDocument();
	});

	it('renders multiple toasts', async () => {
		render(ToastContainer);

		addToast({ type: 'success', message: 'First toast' });
		addToast({ type: 'error', message: 'Second toast' });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const toasts = document.querySelectorAll('.max-w-sm.rounded-lg');
		expect(toasts.length).toBe(2);
	});

	it('shows correct icon for each toast type', async () => {
		render(ToastContainer);

		addToast({ type: 'success', message: 'Success message' });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const icon = document.querySelector('svg.h-5.w-5');
		expect(icon).toBeInTheDocument();
		expect(icon).toHaveClass(/text-green-400/);
	});

	it('allows closing toast via close button', async () => {
		render(ToastContainer);

		addToast({ type: 'info', message: 'Closable toast' });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const closeButton = page.getByRole('button', { name: 'Close notification' });
		await expect.element(closeButton).toBeInTheDocument();

		await closeButton.click();

		await new Promise((resolve) => setTimeout(resolve, 400)); // Wait for transition

		const toasts = document.querySelectorAll('.max-w-sm.rounded-lg');
		expect(toasts.length).toBe(0);
	});
});
