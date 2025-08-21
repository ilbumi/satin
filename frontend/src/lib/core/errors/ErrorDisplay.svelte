<script lang="ts">
	import { errorStore, type AppError } from './store.svelte.js';
	import { Button } from '$lib/components/ui';

	// Get reactive references to the store
	const { errors, showErrors } = errorStore;

	function handleDismiss(id: string) {
		errorStore.dismissError(id);
	}

	function handleRetry(error: AppError) {
		if (error.retryAction) {
			error.retryAction();
			errorStore.dismissError(error.id);
		}
	}

	function handleClearAll() {
		errorStore.clearErrors();
	}

	function getSeverityClasses(severity: AppError['severity']): string {
		switch (severity) {
			case 'low':
				return 'border-blue-200 bg-blue-50 text-blue-800';
			case 'medium':
				return 'border-yellow-200 bg-yellow-50 text-yellow-800';
			case 'high':
				return 'border-orange-200 bg-orange-50 text-orange-800';
			case 'critical':
				return 'border-red-200 bg-red-50 text-red-800';
			default:
				return 'border-gray-200 bg-gray-50 text-gray-800';
		}
	}

	function getSeverityIcon(severity: AppError['severity']): string {
		switch (severity) {
			case 'low':
				return '🔵';
			case 'medium':
				return '🟡';
			case 'high':
				return '🟠';
			case 'critical':
				return '🔴';
			default:
				return 'ℹ️';
		}
	}
</script>

{#if showErrors && errors.length > 0}
	<div class="fixed top-4 right-4 z-50 w-96 space-y-2">
		<!-- Clear all button -->
		{#if errors.length > 1}
			<div class="flex justify-end">
				<Button
					variant="ghost"
					size="sm"
					onclick={handleClearAll}
					class="text-xs opacity-70 hover:opacity-100"
				>
					Clear All ({errors.length})
				</Button>
			</div>
		{/if}

		<!-- Error notifications -->
		{#each errors as error (error.id)}
			<div
				class="animate-slide-in-right rounded-lg border p-4 shadow-lg transition-all duration-300 {getSeverityClasses(
					error.severity
				)}"
				role="alert"
				aria-live="polite"
			>
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<span class="text-lg" role="img" aria-label={`${error.severity} severity`}>
							{getSeverityIcon(error.severity)}
						</span>
					</div>

					<div class="ml-3 flex-1">
						<h4 class="text-sm font-medium">{error.title}</h4>
						<p class="mt-1 text-sm opacity-90">{error.message}</p>

						{#if error.source}
							<p class="mt-1 text-xs opacity-70">Source: {error.source}</p>
						{/if}

						<div class="mt-3 flex items-center space-x-2">
							{#if error.recoverable && error.retryAction}
								<Button
									variant="secondary"
									size="sm"
									onclick={() => handleRetry(error)}
									class="text-xs"
								>
									Retry
								</Button>
							{/if}

							<Button
								variant="ghost"
								size="sm"
								onclick={() => handleDismiss(error.id)}
								class="text-xs opacity-70 hover:opacity-100"
							>
								Dismiss
							</Button>
						</div>
					</div>

					<div class="ml-4 flex-shrink-0">
						<button
							type="button"
							onclick={() => handleDismiss(error.id)}
							class="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:ring-2 focus:ring-offset-2 focus:outline-none"
							aria-label="Dismiss error"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	@keyframes slide-in-right {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in-right {
		animation: slide-in-right 0.3s ease-out;
	}
</style>
