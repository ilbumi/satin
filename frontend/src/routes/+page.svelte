<script lang="ts">
	import { Toast, ErrorBoundary } from '$lib/components/ui';
	import { ConnectionStatus, SystemTestResults } from '$lib/components/dashboard';
	import { connectionStore } from '$lib/features/connection';

	// Toast states for user feedback
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error' | 'warning' | 'info'>('info');

	// Handle connection store changes for toast notifications
	$effect(() => {
		if (connectionStore.status === 'connected' && connectionStore.retryCount > 0) {
			toastType = 'success';
			toastMessage = 'Successfully reconnected to backend!';
			showToast = true;
		} else if (connectionStore.status === 'error' && connectionStore.retryCount > 0) {
			toastType = 'error';
			toastMessage = connectionStore.error || 'Connection failed';
			showToast = true;
		}
	});

	async function handleRetry() {
		await connectionStore.manualRetry();
	}

	// Dashboard layout classes
	const containerClasses = 'p-6';
	const headerClasses = 'mb-8';
	const titleClasses = 'text-3xl font-bold text-gray-900';
	const subtitleClasses = 'mt-2 text-gray-600';
	const gridClasses = 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';
	const quickActionsClasses = 'space-y-3';
	const linkClasses = 'block text-sm text-blue-600 hover:text-blue-800 transition-colors';
	const systemResultsClasses = 'mt-8';
</script>

<ErrorBoundary fallbackMessage="Failed to load dashboard. Please try again." onRetry={handleRetry}>
	<div class={containerClasses}>
		<!-- Dashboard Header -->
		<div class={headerClasses}>
			<h1 class={titleClasses}>Dashboard</h1>
			<p class={subtitleClasses}>Welcome to Satin - Image Annotation Platform</p>
		</div>

		<!-- Dashboard Grid -->
		<div class={gridClasses}>
			<!-- Connection Status -->
			<ConnectionStatus showProjectCount={true} showRetryButton={true} autoCheck={true} />

			<!-- Quick Actions -->
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<h2 class="mb-3 text-lg font-semibold text-gray-900">Quick Actions</h2>
				<div class={quickActionsClasses}>
					<a href="/projects" class={linkClasses}>📁 Manage Projects</a>
					<a href="/tasks" class={linkClasses}>✅ View Tasks</a>
					<a href="/annotations" class={linkClasses}>✏️ Start Annotating</a>
				</div>
			</div>

			<!-- Recent Activity -->
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<h2 class="mb-3 text-lg font-semibold text-gray-900">Recent Activity</h2>
				<div class="space-y-2">
					{#if connectionStore.recentResults.length === 0}
						{#if connectionStore.status === 'testing'}
							<p class="text-sm text-gray-500">Running tests...</p>
						{:else}
							<p class="text-sm text-gray-500">No recent activity</p>
						{/if}
					{:else}
						{#each connectionStore.recentResults as result (result.id)}
							<p class="font-mono text-xs text-gray-600">{result.message}</p>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- System Test Results -->
		<div class={systemResultsClasses}>
			<SystemTestResults showAllResults={true} />
		</div>
	</div>
</ErrorBoundary>

{#if showToast}
	<Toast type={toastType} message={toastMessage} onClose={() => (showToast = false)} />
{/if}
