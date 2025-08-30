import { createDebounced } from '$lib/utils/state';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Custom hook for auto-saving data with debouncing
 */
export function useAutoSave<T>(
	saveFunction: (data: T) => Promise<void>,
	options?: {
		delay?: number;
		onStatusChange?: (status: SaveStatus) => void;
	}
) {
	const { delay = 2000, onStatusChange } = options || {};

	let status = $state<SaveStatus>('idle');
	let hasUnsavedChanges = $state(false);
	let statusResetTimer: ReturnType<typeof setTimeout> | null = null;

	// Notify status changes
	$effect(() => {
		onStatusChange?.(status);
	});

	const performSave = async (data: T) => {
		if (status === 'saving') return;

		status = 'saving';
		hasUnsavedChanges = false;

		try {
			await saveFunction(data);
			status = 'saved';

			// Clear existing timer before setting new one
			if (statusResetTimer) {
				clearTimeout(statusResetTimer);
			}

			// Reset to idle after showing saved status
			statusResetTimer = setTimeout(() => {
				if (status === 'saved') {
					status = 'idle';
				}
				statusResetTimer = null;
			}, 1000);
		} catch (error) {
			status = 'error';
			hasUnsavedChanges = true; // Mark as unsaved since save failed
			throw error;
		}
	};

	const { set: debouncedSave, cancel } = createDebounced(performSave, delay);

	// Cleanup on unmount
	$effect(() => {
		return () => {
			cancel(); // Cancel debounced saves
			if (statusResetTimer) {
				clearTimeout(statusResetTimer);
				statusResetTimer = null;
			}
		};
	});

	return {
		get status() {
			return status;
		},
		get hasUnsavedChanges() {
			return hasUnsavedChanges;
		},

		// Mark data as changed and trigger auto-save
		markChanged(data: T) {
			hasUnsavedChanges = true;
			status = 'idle';
			debouncedSave(data);
		},

		// Save immediately without debouncing
		async saveNow(data: T) {
			cancel(); // Cancel any pending debounced save
			await performSave(data);
		},

		// Cancel any pending saves
		cancelPendingSave() {
			cancel();
			if (hasUnsavedChanges && status !== 'saving') {
				status = 'idle';
			}
		},

		// Save on unmount if there are unsaved changes
		async saveOnUnmount(data: T) {
			if (hasUnsavedChanges && status !== 'saving') {
				await performSave(data);
			}
		},

		// Derived states
		get isIdle() {
			return status === 'idle';
		},
		get isSaving() {
			return status === 'saving';
		},
		get isSaved() {
			return status === 'saved';
		},
		get hasError() {
			return status === 'error';
		}
	};
}
