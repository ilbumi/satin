import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
	getToasts,
	addToast,
	removeToast,
	clearToasts,
	showSuccess,
	showError,
	showWarning,
	showInfo
} from './toast.svelte';

// Mock browser environment for tests
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('toast store (Svelte 5)', () => {
	beforeEach(() => {
		clearToasts();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		clearToasts();
	});

	it('starts with empty toast array', () => {
		expect(getToasts()).toEqual([]);
	});

	it('adds toast with auto-generated id', () => {
		const id = addToast({
			type: 'success',
			message: 'Test message'
		});

		const currentToasts = getToasts();
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('success');
		expect(currentToasts[0].message).toBe('Test message');
		expect(currentToasts[0].duration).toBe(5000);
	});

	it('adds toast with title', () => {
		addToast({
			type: 'info',
			title: 'Info Title',
			message: 'Info message'
		});

		const currentToasts = getToasts();
		expect(currentToasts[0].title).toBe('Info Title');
	});

	it('adds toast with custom duration', () => {
		addToast({
			type: 'warning',
			message: 'Warning message',
			duration: 3000
		});

		const currentToasts = getToasts();
		expect(currentToasts[0].duration).toBe(3000);
	});

	it('removes toast by id', () => {
		const id1 = addToast({ type: 'success', message: 'Message 1' });
		const id2 = addToast({ type: 'error', message: 'Message 2' });

		expect(getToasts()).toHaveLength(2);

		removeToast(id1);

		const currentToasts = getToasts();
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id2);
	});

	it('clears all toasts', () => {
		addToast({ type: 'success', message: 'Message 1' });
		addToast({ type: 'error', message: 'Message 2' });

		expect(getToasts()).toHaveLength(2);

		clearToasts();

		expect(getToasts()).toHaveLength(0);
	});

	it('auto-removes toast after duration', () => {
		addToast({
			type: 'info',
			message: 'Auto remove message',
			duration: 1000
		});

		expect(getToasts()).toHaveLength(1);

		vi.advanceTimersByTime(1000);

		expect(getToasts()).toHaveLength(0);
	});

	it('does not auto-remove toast with duration 0', () => {
		addToast({
			type: 'info',
			message: 'Persistent message',
			duration: 0
		});

		expect(getToasts()).toHaveLength(1);

		vi.advanceTimersByTime(10000);

		expect(getToasts()).toHaveLength(1);
	});

	it('does not auto-remove toast with negative duration', () => {
		addToast({
			type: 'info',
			message: 'Persistent message',
			duration: -1
		});

		expect(getToasts()).toHaveLength(1);

		vi.advanceTimersByTime(10000);

		expect(getToasts()).toHaveLength(1);
	});

	it('showSuccess creates success toast', () => {
		const id = showSuccess('Success message', 'Success Title');

		const currentToasts = getToasts();
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('success');
		expect(currentToasts[0].message).toBe('Success message');
		expect(currentToasts[0].title).toBe('Success Title');
		expect(currentToasts[0].duration).toBe(5000);
	});

	it('showError creates error toast with longer duration', () => {
		const id = showError('Error message', 'Error Title');

		const currentToasts = getToasts();
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('error');
		expect(currentToasts[0].message).toBe('Error message');
		expect(currentToasts[0].title).toBe('Error Title');
		expect(currentToasts[0].duration).toBe(7000);
	});

	it('showWarning creates warning toast', () => {
		const id = showWarning('Warning message');

		const currentToasts = getToasts();
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('warning');
		expect(currentToasts[0].message).toBe('Warning message');
		expect(currentToasts[0].duration).toBe(5000);
	});

	it('showInfo creates info toast', () => {
		const id = showInfo('Info message');

		const currentToasts = getToasts();
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('info');
		expect(currentToasts[0].message).toBe('Info message');
		expect(currentToasts[0].duration).toBe(5000);
	});

	it('generates unique toast ids', () => {
		const id1 = addToast({ type: 'success', message: 'Message 1' });
		const id2 = addToast({ type: 'success', message: 'Message 2' });

		expect(id1).not.toBe(id2);
		expect(id1).toMatch(/^toast_\d+_[a-z0-9]+$/);
		expect(id2).toMatch(/^toast_\d+_[a-z0-9]+$/);
	});

	it('maintains toast order', () => {
		const id1 = addToast({ type: 'success', message: 'First' });
		const id2 = addToast({ type: 'error', message: 'Second' });
		const id3 = addToast({ type: 'warning', message: 'Third' });

		const currentToasts = getToasts();
		expect(currentToasts[0].id).toBe(id1);
		expect(currentToasts[1].id).toBe(id2);
		expect(currentToasts[2].id).toBe(id3);
	});

	it('generates timestamp-based IDs that are unique', () => {
		const id1 = addToast({ type: 'success', message: 'Message 1' });

		// Wait a small amount to ensure different timestamp
		vi.advanceTimersByTime(1);

		const id2 = addToast({ type: 'success', message: 'Message 2' });

		expect(id1).not.toBe(id2);
		expect(id1).toMatch(/^toast_\d+_[a-z0-9]+$/);
		expect(id2).toMatch(/^toast_\d+_[a-z0-9]+$/);

		// Extract timestamps and verify they're different
		const timestamp1 = parseInt(id1.split('_')[1]);
		const timestamp2 = parseInt(id2.split('_')[1]);
		expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
	});
});
