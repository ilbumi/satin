<script lang="ts">
	import { onMount } from 'svelte';

	export type ToastType = 'success' | 'error' | 'warning' | 'info';
	export type ToastPosition =
		| 'top-right'
		| 'top-left'
		| 'bottom-right'
		| 'bottom-left'
		| 'top-center'
		| 'bottom-center';

	export interface ToastProps {
		type?: ToastType;
		title?: string;
		message: string;
		duration?: number;
		position?: ToastPosition;
		showCloseButton?: boolean;
		persistent?: boolean;
		onclose?: () => void;
		onClose?: () => void;
	}

	let {
		type = 'info',
		title,
		message,
		duration = 5000,
		position = 'top-right',
		showCloseButton = true,
		persistent = false,
		onclose,
		onClose
	}: ToastProps = $props();

	let visible = $state(true);
	let timeoutId: number | null = null;

	// Toast type configurations
	const typeConfig = {
		success: {
			bgColor: 'bg-green-50',
			borderColor: 'border-green-200',
			textColor: 'text-green-800',
			iconColor: 'text-green-400',
			iconPath:
				'M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.23a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
		},
		error: {
			bgColor: 'bg-red-50',
			borderColor: 'border-red-200',
			textColor: 'text-red-800',
			iconColor: 'text-red-400',
			iconPath:
				'M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z'
		},
		warning: {
			bgColor: 'bg-yellow-50',
			borderColor: 'border-yellow-200',
			textColor: 'text-yellow-800',
			iconColor: 'text-yellow-400',
			iconPath:
				'M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z'
		},
		info: {
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200',
			textColor: 'text-blue-800',
			iconColor: 'text-blue-400',
			iconPath:
				'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z'
		}
	};

	// Position classes
	const positionClasses = {
		'top-right': 'top-4 right-4',
		'top-left': 'top-4 left-4',
		'bottom-right': 'bottom-4 right-4',
		'bottom-left': 'bottom-4 left-4',
		'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
		'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
	};

	// Get configuration for current type
	const config = typeConfig[type];

	// Close toast
	function closeToast() {
		visible = false;
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		// Allow animation to complete before calling close handler
		setTimeout(() => {
			// Call whichever close handler is provided (prefer onClose over onclose)
			if (onClose) {
				onClose();
			} else if (onclose) {
				onclose();
			}
		}, 300);
	}

	// Auto-close timer
	function startAutoCloseTimer() {
		if (!persistent && duration > 0) {
			timeoutId = window.setTimeout(closeToast, duration);
		}
	}

	// Pause/resume timer on hover
	function pauseTimer() {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}

	function resumeTimer() {
		if (!persistent && duration > 0) {
			timeoutId = window.setTimeout(closeToast, duration);
		}
	}

	// Initialize toast
	onMount(() => {
		startAutoCloseTimer();

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
</script>

{#if visible}
	<div
		class="fixed z-50 {positionClasses[position]} w-full max-w-sm"
		role="alert"
		aria-live="polite"
		data-testid="toast-{type}"
	>
		<div
			role="status"
			class="rounded-lg border p-4 shadow-lg transition-all duration-300 {config.bgColor} {config.borderColor}"
			onmouseenter={pauseTimer}
			onmouseleave={resumeTimer}
		>
			<div class="flex">
				<div class="flex-shrink-0 {config.iconColor}">
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d={config.iconPath} clip-rule="evenodd" />
					</svg>
				</div>

				<div class="ml-3 flex-1">
					{#if title}
						<h3 class="text-sm font-medium {config.textColor}">
							{title}
						</h3>
					{/if}

					<div class="text-sm {config.textColor} {title ? 'mt-1' : ''}">
						{message}
					</div>
				</div>

				{#if showCloseButton}
					<div class="ml-4 flex flex-shrink-0">
						<button
							type="button"
							class="inline-flex rounded-md {config.bgColor} {config.textColor} hover:bg-opacity-75 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:outline-none"
							onclick={closeToast}
							aria-label="Close notification"
						>
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path
									d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
								/>
							</svg>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
