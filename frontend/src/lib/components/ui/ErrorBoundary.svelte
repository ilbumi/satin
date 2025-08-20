<script lang="ts">
	import { Button } from '$lib/components/ui';

	export interface ErrorBoundaryProps {
		/** Custom error message to display */
		fallbackMessage?: string;
		/** Show retry button */
		showRetry?: boolean;
		/** Retry callback function */
		onRetry?: () => void;
		/** Custom class for styling */
		class?: string;
		/** Children snippet to render when no error */
		children?: import('svelte').Snippet;
		/** Custom error UI snippet */
		errorSlot?: import('svelte').Snippet<[Error | null]>;
	}

	let {
		fallbackMessage = 'Something went wrong. Please try again.',
		showRetry = true,
		onRetry,
		class: className = '',
		children,
		errorSlot
	}: ErrorBoundaryProps = $props();

	let error = $state<Error | null>(null);
	let hasError = $derived(error !== null);

	// Function to catch errors from child components
	function catchError(err: Error) {
		console.error('ErrorBoundary caught error:', err);
		error = err;
	}

	// Reset error state
	function resetError() {
		error = null;
	}

	// Handle retry
	function handleRetry() {
		resetError();
		onRetry?.();
	}

	// Expose reset function for parent components
	export function reset() {
		resetError();
	}

	// Global error handler for unhandled promise rejections
	function handleUnhandledRejection(event: PromiseRejectionEvent) {
		console.warn('Unhandled promise rejection caught by ErrorBoundary:', event.reason);
		if (event.reason instanceof Error) {
			catchError(event.reason);
		} else {
			catchError(new Error(String(event.reason)));
		}
		event.preventDefault();
	}

	// Add global error listeners when mounted
	if (typeof window !== 'undefined') {
		window.addEventListener('unhandledrejection', handleUnhandledRejection);
	}
</script>

<div class="error-boundary-wrapper">
	{#if hasError}
		<div class="error-boundary rounded-lg border border-red-200 bg-red-50 p-6 {className}">
			{#if errorSlot}
				{@render errorSlot(error)}
			{:else}
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<svg
							class="h-6 w-6 text-red-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
							/>
						</svg>
					</div>
					<div class="ml-3 flex-1">
						<h3 class="text-sm font-medium text-red-800">Error Occurred</h3>
						<div class="mt-2 text-sm text-red-700">
							<p>{fallbackMessage}</p>
							{#if error?.message && error.message !== fallbackMessage}
								<details class="mt-2">
									<summary class="cursor-pointer font-medium text-red-800 hover:text-red-900">
										Technical Details
									</summary>
									<p class="mt-1 font-mono text-xs text-red-600">{error.message}</p>
								</details>
							{/if}
						</div>
						{#if showRetry}
							<div class="mt-4">
								<Button variant="secondary" size="sm" onclick={handleRetry}>Try Again</Button>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		{@render children?.()}
	{/if}
</div>

<style>
	.error-boundary {
		/* Ensure error boundary is visually distinct */
		animation: fadeIn 0.2s ease-in-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	details > summary {
		list-style: none;
	}

	details > summary::-webkit-details-marker {
		display: none;
	}

	details > summary::before {
		content: '▶ ';
		display: inline-block;
		transition: transform 0.2s;
	}

	details[open] > summary::before {
		transform: rotate(90deg);
	}
</style>
