<script lang="ts">
	export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

	export interface ModalProps {
		open?: boolean;
		size?: ModalSize;
		title?: string;
		showCloseButton?: boolean;
		closeOnBackdropClick?: boolean;
		closeOnEscape?: boolean;
		onClose?: () => void;
		children?: import('svelte').Snippet;
		header?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	}

	let {
		open = $bindable(false),
		size = 'md',
		title,
		showCloseButton = true,
		closeOnBackdropClick = true,
		closeOnEscape = true,
		onClose,
		children,
		header,
		footer,
		...rest
	}: ModalProps &
		Omit<import('svelte/elements').SvelteHTMLElements['dialog'], keyof ModalProps> = $props();

	let dialogElement = $state<HTMLDialogElement>();
	let previousActiveElement: Element | null = null;
	let abortController: AbortController | null = null;
	let isListenerAttached = false;

	// Size classes for the modal
	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		full: 'max-w-full mx-4'
	};

	// Handle close modal
	function closeModal() {
		// Call close handler if provided
		if (onClose) {
			onClose();
		}
		open = false;
	}

	// Combined keydown handler for escape key and focus trap
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape) {
			closeModal();
			return;
		}

		// Handle focus trap
		handleFocusTrap(event);
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdropClick && dialogElement && event.target === dialogElement) {
			closeModal();
		}
	}

	// Focus trap helpers
	function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
		if (!container) return [];

		const focusableSelectors = [
			'button:not([disabled])',
			'[href]',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])'
		];
		return Array.from(container.querySelectorAll(focusableSelectors.join(', '))) as HTMLElement[];
	}

	function handleFocusTrap(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !dialogElement || !open) return;

		const focusableElements = getFocusableElements(dialogElement);
		if (focusableElements.length === 0) return;

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (event.shiftKey) {
			if (document.activeElement === firstElement) {
				event.preventDefault();
				lastElement?.focus();
			}
		} else {
			if (document.activeElement === lastElement) {
				event.preventDefault();
				firstElement?.focus();
			}
		}
	}

	// Function to safely attach event listeners
	function attachEventListeners() {
		if (isListenerAttached || !open) return;

		// Clean up any existing controller
		if (abortController) {
			abortController.abort();
		}

		// Create new abort controller for this modal instance
		abortController = new AbortController();

		// Add single combined keydown listener
		document.addEventListener('keydown', handleKeydown, {
			signal: abortController.signal,
			passive: false
		});

		isListenerAttached = true;
	}

	// Function to safely remove event listeners
	function removeEventListeners() {
		if (!isListenerAttached) return;

		if (abortController) {
			abortController.abort();
			abortController = null;
		}

		isListenerAttached = false;
	}

	// Handle modal open/close effects
	$effect(() => {
		if (open && dialogElement) {
			// Store previously focused element
			previousActiveElement = document.activeElement;

			// Focus first focusable element or the dialog itself
			requestAnimationFrame(() => {
				if (!dialogElement || !open) return;

				const focusableElements = getFocusableElements(dialogElement);
				try {
					if (focusableElements.length > 0) {
						focusableElements[0].focus();
					} else {
						dialogElement.focus();
					}
				} catch {
					// Element might not be focusable, ignore the error silently
				}
			});

			// Add event listeners safely
			attachEventListeners();

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		} else if (!open) {
			// Remove event listeners safely
			removeEventListeners();

			// Restore body scroll
			document.body.style.overflow = '';

			// Restore focus to previously focused element
			if (previousActiveElement instanceof HTMLElement) {
				try {
					previousActiveElement.focus();
				} catch {
					// Element might not be focusable anymore, ignore the error silently
				}
			}
		}

		// Cleanup function
		return () => {
			removeEventListeners();
			document.body.style.overflow = '';
		};
	});
</script>

{#if open}
	<dialog
		bind:this={dialogElement}
		class="backdrop:bg-opacity-50 fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none bg-transparent backdrop:bg-gray-900 backdrop:backdrop-blur-sm"
		onclick={handleBackdropClick}
		{...rest}
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		data-testid={rest['data-testid'] || 'modal'}
		open
	>
		<div class="flex min-h-full items-center justify-center p-4">
			<div
				class="w-full {sizeClasses[
					size
				]} transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
			>
				{#if header || title || showCloseButton}
					<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
						<div class="flex items-center">
							{#if header}
								{@render header()}
							{:else if title}
								<h3 id="modal-title" class="text-lg font-semibold text-gray-900">
									{title}
								</h3>
							{/if}
						</div>

						{#if showCloseButton}
							<button
								type="button"
								onclick={closeModal}
								class="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
								aria-label="Close modal"
							>
								<svg
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				{/if}

				<div class="px-6 py-4">
					{@render children?.()}
				</div>

				{#if footer}
					<div class="border-t border-gray-200 px-6 py-4">
						{@render footer()}
					</div>
				{/if}
			</div>
		</div>
	</dialog>
{/if}
