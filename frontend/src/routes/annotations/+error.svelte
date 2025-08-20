<script lang="ts">
	import { page } from '$app/stores';
	import { Button, Card } from '$lib/components/ui';

	// Define SvelteKit error interface
	interface SvelteKitError extends Error {
		status?: number;
		stack?: string;
	}

	// SvelteKit error pages only accept 'data' and 'errors' as props
	// The error object is available through $page.error
	let error = $derived($page.error as SvelteKitError | null);

	// Extract error details - SvelteKit error type has status and message
	let errorMessage = $derived(error?.message || 'An unexpected error occurred');
	let errorStatus = $derived(error?.status || 500);

	function reloadPage() {
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}

	function goHome() {
		if (typeof window !== 'undefined') {
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<title>Error - Annotation Workspace - Satin</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-6">
	<div class="w-full max-w-md">
		<Card class="text-center">
			<div class="p-8">
				<!-- Error Icon -->
				<div class="mb-6">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
						<svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>

				<!-- Error Content -->
				<h1 class="mb-2 text-2xl font-bold text-gray-900">
					{errorStatus === 500 ? 'Server Error' : `Error ${errorStatus}`}
				</h1>

				<p class="mb-6 text-gray-600">
					{#if errorStatus === 500}
						There was a problem loading the annotation workspace. This might be a temporary issue.
					{:else}
						{errorMessage}
					{/if}
				</p>

				<!-- Action Buttons -->
				<div class="space-y-3">
					<Button variant="primary" class="w-full" onclick={reloadPage}>🔄 Try Again</Button>

					<Button variant="secondary" class="w-full" onclick={goHome}>🏠 Go to Dashboard</Button>
				</div>

				<!-- Debug Info (development only) -->
				{#if import.meta.env.DEV}
					<details class="mt-6 text-left">
						<summary class="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
							Debug Information
						</summary>
						<div class="mt-2 overflow-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-700">
							<p><strong>Status:</strong> {errorStatus}</p>
							<p><strong>Message:</strong> {errorMessage}</p>
							<p><strong>URL:</strong> {$page.url.href}</p>
							{#if error?.stack}
								<p><strong>Stack:</strong></p>
								<pre class="whitespace-pre-wrap">{error.stack}</pre>
							{/if}
						</div>
					</details>
				{/if}
			</div>
		</Card>
	</div>
</div>
