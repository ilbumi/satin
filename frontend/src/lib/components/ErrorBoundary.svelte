<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		children?: import('svelte').Snippet;
		fallback?: import('svelte').Snippet<[Error]>;
	}

	let { children, fallback }: Props = $props();
	let hasError = $state(false);
	let error: Error | null = $state(null);

	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			hasError = true;
			error = new Error(event.message);
			console.error('ErrorBoundary caught an error:', event.error);
		};

		const handleRejection = (event: PromiseRejectionEvent) => {
			hasError = true;
			error = new Error(event.reason);
			console.error('ErrorBoundary caught an unhandled promise rejection:', event.reason);
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleRejection);
		};
	});

	function resetError() {
		hasError = false;
		error = null;
	}
</script>

{#if hasError && error}
	{#if fallback}
		{@render fallback(error)}
	{:else}
		<div class="rounded-lg border border-red-200 bg-red-50 p-6">
			<div class="flex items-center">
				<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
						clip-rule="evenodd"
					/>
				</svg>
				<h2 class="ml-2 text-lg font-semibold text-red-800">Something went wrong</h2>
			</div>
			<div class="mt-4">
				<p class="text-red-700">
					{error.message || 'An unexpected error occurred'}
				</p>
				<details class="mt-2">
					<summary class="cursor-pointer text-sm text-red-600 hover:text-red-800">
						Show details
					</summary>
					<pre class="mt-2 text-xs whitespace-pre-wrap text-red-600">{error.stack}</pre>
				</details>
			</div>
			<div class="mt-4">
				<button
					onclick={resetError}
					class="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
				>
					Try Again
				</button>
			</div>
		</div>
	{/if}
{:else if children}
	{@render children()}
{/if}
