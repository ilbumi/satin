import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title?: string;
	message: string;
	duration?: number;
}

export const toasts = writable<Toast[]>([]);

let toastId = 0;

export function addToast(toast: Omit<Toast, 'id'>) {
	const id = (++toastId).toString();
	const newToast: Toast = {
		...toast,
		id,
		duration: toast.duration ?? 5000
	};

	toasts.update((currentToasts) => [...currentToasts, newToast]);

	if (newToast.duration && newToast.duration > 0) {
		setTimeout(() => {
			removeToast(id);
		}, newToast.duration);
	}

	return id;
}

export function removeToast(id: string) {
	toasts.update((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
}

export function clearToasts() {
	toasts.set([]);
}

// Convenience functions
export function showSuccess(message: string, title?: string) {
	return addToast({ type: 'success', message, title });
}

export function showError(message: string, title?: string) {
	return addToast({ type: 'error', message, title, duration: 7000 });
}

export function showWarning(message: string, title?: string) {
	return addToast({ type: 'warning', message, title });
}

export function showInfo(message: string, title?: string) {
	return addToast({ type: 'info', message, title });
}
