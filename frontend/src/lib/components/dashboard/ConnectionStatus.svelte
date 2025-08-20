<script lang="ts">
	import { onMount } from 'svelte';
	import { connectionStore } from '$lib/features/connection';
	import { Card, Spinner } from '$lib/components/ui';
	import { cn, statusColors, transition } from '$lib/core/styles';

	interface ConnectionStatusProps {
		class?: string;
		showProjectCount?: boolean;
		showRetryButton?: boolean;
		autoCheck?: boolean;
	}

	let {
		class: className = '',
		showProjectCount = true,
		showRetryButton = true,
		autoCheck = true
	}: ConnectionStatusProps = $props();

	// Computed classes for consistent styling
	const computedClasses = $derived(cn(transition.colors, className));

	// Status indicator classes
	const statusClasses = $derived(() => {
		switch (connectionStore.status) {
			case 'connected':
				return connectionStore.health?.overall === 'degraded'
					? cn(statusColors.warning.bg, 'h-3 w-3 rounded-full')
					: cn(statusColors.success.bg, 'h-3 w-3 rounded-full');
			case 'disconnected':
			case 'error':
				return cn(statusColors.error.bg, 'h-3 w-3 rounded-full');
			case 'testing':
				return cn(statusColors.info.bg, 'h-3 w-3 rounded-full');
			default:
				return cn(statusColors.neutral.bg, 'h-3 w-3 rounded-full');
		}
	});

	const retryButtonClasses = $derived(() => {
		const baseRetryClasses = cn(
			'rounded px-2 py-1 text-xs font-medium',
			transition.colors,
			'bg-blue-600 text-white'
		);

		if (connectionStore.isRetrying || !connectionStore.canRetry) {
			return cn(baseRetryClasses, 'opacity-50 cursor-not-allowed');
		}

		return cn(
			baseRetryClasses,
			'hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
		);
	});

	// Static class constants
	const headerClasses = 'flex items-center justify-between';
	const titleClasses = 'text-lg font-semibold text-gray-900';
	const statusItemClasses = 'flex items-center space-x-3';
	const statusLabelClasses = 'text-sm font-medium text-gray-900';
	const statusValueClasses = 'text-sm text-gray-600 font-mono';

	async function handleRetry() {
		await connectionStore.manualRetry();
	}

	onMount(() => {
		if (autoCheck) {
			connectionStore.checkHealth();
		}
	});
</script>

<Card variant="default" class={computedClasses}>
	{#snippet header()}
		<div class={headerClasses}>
			<h2 class={titleClasses}>System Status</h2>
			{#if connectionStore.status === 'testing'}
				<Spinner size="sm" />
			{/if}
		</div>
	{/snippet}

	<div class="space-y-4">
		<!-- Connection Status Display -->
		<div class={statusItemClasses}>
			<div class="flex-shrink-0">
				<div class={statusClasses}></div>
			</div>
			<div class="flex-1">
				<p class={statusLabelClasses}>Backend Connection</p>
				<p class={statusValueClasses}>{connectionStore.statusDisplay}</p>
			</div>
		</div>

		<!-- Error Display -->
		{#if connectionStore.error}
			<div class="rounded-md bg-red-50 p-3">
				<div class="flex items-start">
					<div class="flex-shrink-0">
						<svg
							class="h-5 w-5 text-red-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
							/>
						</svg>
					</div>
					<div class="ml-3 flex-1">
						<p class="text-sm text-red-800">{connectionStore.error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Retry Button -->
		{#if showRetryButton && (connectionStore.error || connectionStore.status === 'disconnected')}
			<div class="flex items-center justify-between">
				<button
					class={retryButtonClasses}
					onclick={handleRetry}
					disabled={connectionStore.isRetrying || !connectionStore.canRetry}
				>
					{#if connectionStore.isRetrying}
						Retrying...
					{:else if connectionStore.retryCount >= connectionStore.maxRetries}
						Max Retries Reached
					{:else}
						Retry Connection
					{/if}
				</button>

				{#if connectionStore.retryCount > 0}
					<span class="text-xs text-gray-500">
						Attempt {connectionStore.retryCount}/{connectionStore.maxRetries}
					</span>
				{/if}
			</div>
		{/if}

		<!-- Project Count -->
		{#if showProjectCount && connectionStore.status === 'connected'}
			<div class="border-t border-gray-200 pt-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">Total Projects:</span>
					<span class="font-mono text-sm text-gray-900">{connectionStore.projectCount}</span>
				</div>
			</div>
		{/if}

		<!-- Last Check Time -->
		{#if connectionStore.lastTestTime}
			<div class="text-xs text-gray-500">
				Last checked: {connectionStore.lastTestTime.toLocaleTimeString()}
			</div>
		{/if}
	</div>
</Card>
