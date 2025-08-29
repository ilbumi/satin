import { browser } from '$app/environment';

export interface Toast {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title?: string;
	message: string;
	duration?: number;
}

// Generate unique IDs using timestamp + random component
function generateToastId(): string {
	return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Module-level shared state using Svelte 5 runes
const toasts = $state<Toast[]>([]);

export function addToast(toast: Omit<Toast, 'id'>): string {
	const id = generateToastId();
	const newToast: Toast = {
		...toast,
		id,
		duration: toast.duration ?? 5000
	};

	toasts.push(newToast);

	// Auto-remove toast after duration (only in browser)
	if (browser && newToast.duration && newToast.duration > 0) {
		setTimeout(() => {
			removeToast(id);
		}, newToast.duration);
	}

	return id;
}

export function removeToast(id: string): void {
	const index = toasts.findIndex((toast) => toast.id === id);
	if (index !== -1) {
		toasts.splice(index, 1);
	}
}

export function clearToasts(): void {
	toasts.length = 0;
}

// Getter function to access toasts reactively
export function getToasts(): Toast[] {
	return toasts;
}

// Convenience functions
export function showSuccess(message: string, title?: string): string {
	return addToast({ type: 'success', message, title });
}

export function showError(message: string, title?: string): string {
	return addToast({ type: 'error', message, title, duration: 7000 });
}

export function showWarning(message: string, title?: string): string {
	return addToast({ type: 'warning', message, title });
}

export function showInfo(message: string, title?: string): string {
	return addToast({ type: 'info', message, title });
}
