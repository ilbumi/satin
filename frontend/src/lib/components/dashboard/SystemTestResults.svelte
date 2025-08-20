<script lang="ts">
	import { connectionStore } from '$lib/features/connection';
	import { Card } from '$lib/components/ui';
	import type { TestResult } from '$lib/features/connection/types';

	interface SystemTestResultsProps {
		class?: string;
		showAllResults?: boolean;
	}

	let { class: className = '', showAllResults = false }: SystemTestResultsProps = $props();

	// Computed classes for consistent styling
	const baseClasses = 'transition-opacity';
	const computedClasses = $derived(`${baseClasses} ${className}`);

	// Get results to display
	const displayResults = $derived(
		showAllResults ? connectionStore.testResults : connectionStore.recentResults
	);

	function getResultIcon(status: TestResult['status']): string {
		switch (status) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'warning':
				return '⚠️';
			default:
				return '❓';
		}
	}

	function getResultClasses(status: TestResult['status']): string {
		const baseResultClasses = 'font-mono text-sm';
		switch (status) {
			case 'success':
				return `${baseResultClasses} text-green-700`;
			case 'error':
				return `${baseResultClasses} text-red-700`;
			case 'warning':
				return `${baseResultClasses} text-yellow-700`;
			default:
				return `${baseResultClasses} text-gray-700`;
		}
	}
</script>

<Card variant="default" class={computedClasses}>
	{#snippet header()}
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">System Test Results</h2>
			{#if !showAllResults && connectionStore.testResults.length > 3}
				<span class="text-sm text-gray-500">Last 3 results</span>
			{/if}
		</div>
	{/snippet}

	<div class="space-y-3">
		{#if displayResults.length === 0}
			{#if connectionStore.status === 'testing'}
				<div class="flex items-center space-x-2 text-gray-500">
					<div class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
					<span class="text-sm">Running tests...</span>
				</div>
			{:else}
				<p class="text-sm text-gray-500">No test results available.</p>
			{/if}
		{:else}
			<ul class="space-y-2">
				{#each displayResults as result (result.id)}
					<li class="flex items-start space-x-2">
						<span class="flex-shrink-0 text-base" aria-hidden="true">
							{getResultIcon(result.status)}
						</span>
						<div class="min-w-0 flex-1">
							<p class={getResultClasses(result.status)}>{result.message}</p>
							<p class="mt-1 text-xs text-gray-500">
								{result.name} • {result.timestamp.toLocaleTimeString()}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}

		{#if connectionStore.status === 'connected' || connectionStore.status === 'error'}
			<div class="border-t border-gray-200 pt-3">
				<p class="text-xs text-gray-500">
					Check the browser console for detailed connectivity test results.
				</p>
			</div>
		{/if}
	</div>
</Card>
