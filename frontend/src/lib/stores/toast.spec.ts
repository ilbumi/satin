import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	toasts,
	addToast,
	removeToast,
	clearToasts,
	showSuccess,
	showError,
	showWarning,
	showInfo
} from './toast';

describe('toast store', () => {
	beforeEach(() => {
		clearToasts();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		clearToasts();
	});

	it('starts with empty toast array', () => {
		expect(get(toasts)).toEqual([]);
	});

	it('adds toast with auto-generated id', () => {
		const id = addToast({
			type: 'success',
			message: 'Test message'
		});

		const currentToasts = get(toasts);
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

		const currentToasts = get(toasts);
		expect(currentToasts[0].title).toBe('Info Title');
	});

	it('adds toast with custom duration', () => {
		addToast({
			type: 'warning',
			message: 'Warning message',
			duration: 3000
		});

		const currentToasts = get(toasts);
		expect(currentToasts[0].duration).toBe(3000);
	});

	it('removes toast by id', () => {
		const id1 = addToast({ type: 'success', message: 'Message 1' });
		const id2 = addToast({ type: 'error', message: 'Message 2' });

		expect(get(toasts)).toHaveLength(2);

		removeToast(id1);

		const currentToasts = get(toasts);
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id2);
	});

	it('clears all toasts', () => {
		addToast({ type: 'success', message: 'Message 1' });
		addToast({ type: 'error', message: 'Message 2' });

		expect(get(toasts)).toHaveLength(2);

		clearToasts();

		expect(get(toasts)).toHaveLength(0);
	});

	it('auto-removes toast after duration', () => {
		addToast({
			type: 'info',
			message: 'Auto remove message',
			duration: 1000
		});

		expect(get(toasts)).toHaveLength(1);

		vi.advanceTimersByTime(1000);

		expect(get(toasts)).toHaveLength(0);
	});

	it('does not auto-remove toast with duration 0', () => {
		addToast({
			type: 'info',
			message: 'Persistent message',
			duration: 0
		});

		expect(get(toasts)).toHaveLength(1);

		vi.advanceTimersByTime(10000);

		expect(get(toasts)).toHaveLength(1);
	});

	it('does not auto-remove toast with negative duration', () => {
		addToast({
			type: 'info',
			message: 'Persistent message',
			duration: -1
		});

		expect(get(toasts)).toHaveLength(1);

		vi.advanceTimersByTime(10000);

		expect(get(toasts)).toHaveLength(1);
	});

	it('showSuccess creates success toast', () => {
		const id = showSuccess('Success message', 'Success Title');

		const currentToasts = get(toasts);
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('success');
		expect(currentToasts[0].message).toBe('Success message');
		expect(currentToasts[0].title).toBe('Success Title');
		expect(currentToasts[0].duration).toBe(5000);
	});

	it('showError creates error toast with longer duration', () => {
		const id = showError('Error message', 'Error Title');

		const currentToasts = get(toasts);
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('error');
		expect(currentToasts[0].message).toBe('Error message');
		expect(currentToasts[0].title).toBe('Error Title');
		expect(currentToasts[0].duration).toBe(7000);
	});

	it('showWarning creates warning toast', () => {
		const id = showWarning('Warning message');

		const currentToasts = get(toasts);
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('warning');
		expect(currentToasts[0].message).toBe('Warning message');
		expect(currentToasts[0].duration).toBe(5000);
	});

	it('showInfo creates info toast', () => {
		const id = showInfo('Info message');

		const currentToasts = get(toasts);
		expect(currentToasts).toHaveLength(1);
		expect(currentToasts[0].id).toBe(id);
		expect(currentToasts[0].type).toBe('info');
		expect(currentToasts[0].message).toBe('Info message');
		expect(currentToasts[0].duration).toBe(5000);
	});

	it('increments toast ids', () => {
		const id1 = addToast({ type: 'success', message: 'Message 1' });
		const id2 = addToast({ type: 'success', message: 'Message 2' });

		expect(parseInt(id2)).toBeGreaterThan(parseInt(id1));
	});

	it('maintains toast order', () => {
		const id1 = addToast({ type: 'success', message: 'First' });
		const id2 = addToast({ type: 'error', message: 'Second' });
		const id3 = addToast({ type: 'warning', message: 'Third' });

		const currentToasts = get(toasts);
		expect(currentToasts[0].id).toBe(id1);
		expect(currentToasts[1].id).toBe(id2);
		expect(currentToasts[2].id).toBe(id3);
	});
});
