<script lang="ts">
	export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

	export interface ModalProps {
		open?: boolean;
		size?: ModalSize;
		title?: string;
		showCloseButton?: boolean;
		closeOnBackdropClick?: boolean;
		closeOnEscape?: boolean;
		onclose?: () => void;
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
		onclose,
		children,
		header,
		footer
	}: ModalProps = $props();

	let dialogElement: HTMLDialogElement;
	let previousActiveElement: Element | null = null;

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
		if (onclose) {
			onclose();
		}
		open = false;
	}

	// Handle escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape) {
			closeModal();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdropClick && event.target === dialogElement) {
			closeModal();
		}
	}

	// Focus trap helpers
	function getFocusableElements(container: HTMLElement): HTMLElement[] {
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
		if (event.key !== 'Tab') return;

		const focusableElements = getFocusableElements(dialogElement);
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

	// Handle modal open/close effects
	$effect(() => {
		if (open) {
			// Store previously focused element
			previousActiveElement = document.activeElement;

			// Show modal and focus first focusable element
			dialogElement?.showModal();

			// Focus first focusable element or the dialog itself
			const focusableElements = getFocusableElements(dialogElement);
			if (focusableElements.length > 0) {
				focusableElements[0].focus();
			} else {
				dialogElement?.focus();
			}

			// Add event listeners
			document.addEventListener('keydown', handleKeydown);
			document.addEventListener('keydown', handleFocusTrap);

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Close modal
			dialogElement?.close();

			// Remove event listeners
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('keydown', handleFocusTrap);

			// Restore body scroll
			document.body.style.overflow = '';

			// Restore focus to previously focused element
			if (previousActiveElement instanceof HTMLElement) {
				previousActiveElement.focus();
			}
		}

		// Cleanup function
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.removeEventListener('keydown', handleFocusTrap);
			document.body.style.overflow = '';
		};
	});
</script>

<dialog
	bind:this={dialogElement}
	class="backdrop:bg-opacity-75 backdrop:bg-gray-500 backdrop:backdrop-blur-sm"
	onclick={handleBackdropClick}
	aria-labelledby={title ? 'modal-title' : undefined}
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
