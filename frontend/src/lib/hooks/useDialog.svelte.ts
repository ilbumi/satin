/**
 * Custom hook for managing dialog state and lifecycle
 * Handles opening/closing dialogs, form state management, and cleanup
 */
export function useDialog<T = Record<string, unknown>>(initialData?: T) {
	let isOpen = $state(false);
	let formData = $state<T>(initialData || ({} as T));

	function open(data?: T) {
		if (data) {
			formData = { ...data };
		}
		isOpen = true;
	}

	function close() {
		isOpen = false;
	}

	function reset() {
		formData = initialData || ({} as T);
	}

	function updateData(updates: Partial<T>) {
		formData = { ...formData, ...updates };
	}

	// Handle ESC key to close dialog
	$effect(() => {
		if (!isOpen) return;

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				close();
			}
		};

		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	return {
		get isOpen() {
			return isOpen;
		},
		get formData() {
			return formData;
		},
		open,
		close,
		reset,
		updateData,

		// Convenience methods
		toggle() {
			if (isOpen) {
				close();
			} else {
				open();
			}
		},

		handleClose() {
			reset();
			close();
		},

		handleBackdropClick(event: MouseEvent, dialogElement: HTMLDialogElement) {
			if (event.target === dialogElement) {
				close();
			}
		}
	};
}
