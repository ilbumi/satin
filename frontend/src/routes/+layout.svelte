<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount, onDestroy } from 'svelte';
	import { setContextClient } from '@urql/svelte';
	import { graphqlClient } from '$lib/core/api/client';
	import { Sidebar, Breadcrumb } from '$lib/components/layout';
	import { navigating } from '$app/state';
	import { ErrorBoundary } from '$lib/components/ui';
	import { ErrorDisplay } from '$lib/core/errors';
	import { initializePerformanceTracking } from '$lib/core/performance';
	import PerformanceDashboard from '$lib/components/debug/PerformanceDashboard.svelte';

	let { children } = $props();

	// Set up the GraphQL client for all child components
	setContextClient(graphqlClient.client);

	// Sidebar state
	let sidebarOpen = $state(false);

	// Performance dashboard state
	let performanceDashboardOpen = $state(false);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		sidebarOpen = false;
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Ctrl/Cmd + Shift + P = Performance Dashboard
		if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
			event.preventDefault();
			performanceDashboardOpen = !performanceDashboardOpen;
		}
	}

	onMount(() => {
		// Initialize performance tracking
		initializePerformanceTracking();

		// Add keyboard event listener
		window.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Sidebar -->
	<Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

	<!-- Main content area -->
	<div class="lg:pl-56">
		<!-- Mobile menu button -->
		<div class="fixed top-4 left-4 z-30 lg:hidden">
			<button
				onclick={toggleSidebar}
				class="rounded-md bg-white p-2 text-gray-600 shadow-md hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset"
			>
				<span class="sr-only">Open sidebar</span>
				<svg
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
					/>
				</svg>
			</button>
		</div>

		<main class="pb-6">
			<div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
				<!-- Breadcrumb -->
				<div class="mb-6">
					<Breadcrumb />
				</div>

				<!-- Loading indicator during navigation -->
				{#if navigating}
					<div class="fixed top-0 right-0 left-0 z-50 h-1 bg-gray-200">
						<div class="h-full animate-pulse bg-blue-500"></div>
					</div>
				{/if}

				<!-- Page content -->
				<div class="min-h-[calc(100vh-8rem)] rounded-lg bg-white shadow-sm">
					<ErrorBoundary
						fallbackMessage="Something went wrong while rendering this page. Please try refreshing."
						showRetry={true}
						onRetry={() => location.reload()}
					>
						{@render children?.()}
					</ErrorBoundary>
				</div>
			</div>
		</main>
	</div>

	<!-- Global error display -->
	<ErrorDisplay />

	<!-- Performance Dashboard -->
	<PerformanceDashboard
		bind:open={performanceDashboardOpen}
		onClose={() => (performanceDashboardOpen = false)}
	/>
</div>
