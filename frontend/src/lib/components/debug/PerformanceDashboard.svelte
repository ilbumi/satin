<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { performanceMonitor, type PerformanceReport } from '$lib/core/performance/monitor';
	import { Card } from '$lib/components/ui';

	interface PerformanceDashboardProps {
		open?: boolean;
		onClose?: () => void;
		autoRefresh?: boolean;
		refreshInterval?: number;
	}

	let {
		open = $bindable(false),
		onClose,
		autoRefresh = true,
		refreshInterval = 5000
	}: PerformanceDashboardProps = $props();

	let report = $state<PerformanceReport | null>(null);
	let refreshTimer = $state<NodeJS.Timeout | null>(null);
	let lastRefresh = $state<number>(Date.now());

	function refreshReport() {
		try {
			report = performanceMonitor.generateReport();
			lastRefresh = Date.now();
		} catch (error) {
			console.warn('Failed to generate performance report:', error);
		}
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatTime(ms: number): string {
		if (ms < 1000) return `${Math.round(ms)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	function getPerformanceGrade(metric: string, value: number): 'good' | 'fair' | 'poor' {
		const thresholds: Record<string, { good: number; fair: number }> = {
			'first-contentful-paint': { good: 1800, fair: 3000 },
			domContentLoaded: { good: 1500, fair: 2500 },
			loadComplete: { good: 3000, fair: 5000 }
		};

		const threshold = thresholds[metric];
		if (!threshold) return 'good';

		if (value <= threshold.good) return 'good';
		if (value <= threshold.fair) return 'fair';
		return 'poor';
	}

	function getGradeColor(grade: 'good' | 'fair' | 'poor'): string {
		switch (grade) {
			case 'good':
				return 'text-green-600';
			case 'fair':
				return 'text-yellow-600';
			case 'poor':
				return 'text-red-600';
		}
	}

	onMount(() => {
		if (open) {
			refreshReport();

			if (autoRefresh) {
				refreshTimer = setInterval(refreshReport, refreshInterval);
			}
		}
	});

	onDestroy(() => {
		if (refreshTimer) {
			clearInterval(refreshTimer);
		}
	});

	// Refresh when opened
	$effect(() => {
		if (open) {
			refreshReport();

			if (autoRefresh && !refreshTimer) {
				refreshTimer = setInterval(refreshReport, refreshInterval);
			}
		} else {
			if (refreshTimer) {
				clearInterval(refreshTimer);
				refreshTimer = null;
			}
		}
	});
</script>

{#if open}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-lg bg-white shadow-xl">
			<div class="border-b border-gray-200 p-6">
				<div class="flex items-center justify-between">
					<h2 class="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
					<div class="flex items-center gap-4">
						<span class="text-sm text-gray-500">
							Last updated: {new Date(lastRefresh).toLocaleTimeString()}
						</span>
						<button
							onclick={() => refreshReport()}
							class="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
						>
							Refresh
						</button>
						<button onclick={() => onClose?.()} class="text-gray-400 hover:text-gray-600">
							✕
						</button>
					</div>
				</div>
			</div>

			{#if report}
				<div class="space-y-6 p-6">
					<!-- Navigation Metrics -->
					<section>
						<h3 class="mb-4 text-lg font-semibold text-gray-900">Navigation Performance</h3>
						<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
							<Card>
								<div class="text-center">
									<div
										class="text-2xl font-bold {getGradeColor(
											getPerformanceGrade(
												'first-contentful-paint',
												report.navigation.firstContentfulPaint
											)
										)}"
									>
										{formatTime(report.navigation.firstContentfulPaint)}
									</div>
									<div class="text-sm text-gray-600">First Contentful Paint</div>
								</div>
							</Card>
							<Card>
								<div class="text-center">
									<div
										class="text-2xl font-bold {getGradeColor(
											getPerformanceGrade('domContentLoaded', report.navigation.domContentLoaded)
										)}"
									>
										{formatTime(report.navigation.domContentLoaded)}
									</div>
									<div class="text-sm text-gray-600">DOM Content Loaded</div>
								</div>
							</Card>
							<Card>
								<div class="text-center">
									<div class="text-2xl font-bold text-gray-900">
										{formatTime(report.navigation.firstPaint)}
									</div>
									<div class="text-sm text-gray-600">First Paint</div>
								</div>
							</Card>
							<Card>
								<div class="text-center">
									<div class="text-2xl font-bold text-gray-900">
										{formatTime(report.navigation.largestContentfulPaint)}
									</div>
									<div class="text-sm text-gray-600">Largest Contentful Paint</div>
								</div>
							</Card>
						</div>
					</section>

					<!-- Memory Usage -->
					<section>
						<h3 class="mb-4 text-lg font-semibold text-gray-900">Memory Usage</h3>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<Card>
								<div class="text-center">
									<div class="text-2xl font-bold text-gray-900">
										{formatBytes(report.memory.used)}
									</div>
									<div class="text-sm text-gray-600">Used Memory</div>
								</div>
							</Card>
							<Card>
								<div class="text-center">
									<div class="text-2xl font-bold text-gray-900">
										{formatBytes(report.memory.total)}
									</div>
									<div class="text-sm text-gray-600">Total Allocated</div>
								</div>
							</Card>
							<Card>
								<div class="text-center">
									<div class="text-2xl font-bold text-gray-900">
										{Math.round((report.memory.used / report.memory.total) * 100)}%
									</div>
									<div class="text-sm text-gray-600">Memory Usage</div>
								</div>
							</Card>
						</div>
					</section>

					<!-- Bundle Analysis -->
					<section>
						<h3 class="mb-4 text-lg font-semibold text-gray-900">Bundle Performance</h3>
						{#if report.bundles.length > 0}
							<div class="space-y-4">
								<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
									<Card>
										<div class="text-center">
											<div class="text-2xl font-bold text-gray-900">
												{report.bundles.length}
											</div>
											<div class="text-sm text-gray-600">Total Chunks</div>
										</div>
									</Card>
									<Card>
										<div class="text-center">
											<div class="text-2xl font-bold text-gray-900">
												{formatBytes(report.bundles.reduce((sum, bundle) => sum + bundle.size, 0))}
											</div>
											<div class="text-sm text-gray-600">Total Bundle Size</div>
										</div>
									</Card>
									<Card>
										<div class="text-center">
											<div class="text-2xl font-bold text-gray-900">
												{Math.round(
													report.bundles.reduce((sum, bundle) => sum + bundle.loadTime, 0) /
														report.bundles.length
												)}ms
											</div>
											<div class="text-sm text-gray-600">Avg Load Time</div>
										</div>
									</Card>
								</div>

								<div class="overflow-x-auto">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-gray-50">
											<tr>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
													>Chunk</th
												>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
													>Size</th
												>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
													>Load Time</th
												>
												<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
													>Cache</th
												>
											</tr>
										</thead>
										<tbody class="divide-y divide-gray-200 bg-white">
											{#each report.bundles.slice(0, 10) as bundle (bundle.chunkName)}
												<tr>
													<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
														{bundle.chunkName}
													</td>
													<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
														{formatBytes(bundle.size)}
													</td>
													<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
														{formatTime(bundle.loadTime)}
													</td>
													<td class="px-6 py-4 text-sm whitespace-nowrap">
														<span
															class="rounded px-2 py-1 text-xs {bundle.cacheHit
																? 'bg-green-100 text-green-800'
																: 'bg-red-100 text-red-800'}"
														>
															{bundle.cacheHit ? 'Hit' : 'Miss'}
														</span>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{:else}
							<Card>
								<div class="py-8 text-center">
									<div class="text-gray-500">No bundle metrics available yet</div>
									<div class="text-sm text-gray-400">
										Bundle metrics will appear as resources load
									</div>
								</div>
							</Card>
						{/if}
					</section>

					<!-- Component Performance -->
					<section>
						<h3 class="mb-4 text-lg font-semibold text-gray-900">Component Performance</h3>
						{#if report.components.length > 0}
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>Component</th
											>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>Render Time</th
											>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>Mount Time</th
											>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>Re-renders</th
											>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>Last Render</th
											>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										{#each report.components.slice(0, 10) as component (component.componentName)}
											<tr>
												<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
													{component.componentName}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
													{formatTime(component.renderTime)}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
													{formatTime(component.mountTime)}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
													{component.rerenderCount}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
													{new Date(component.lastRenderTimestamp).toLocaleTimeString()}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{:else}
							<Card>
								<div class="py-8 text-center">
									<div class="text-gray-500">No component metrics available yet</div>
									<div class="text-sm text-gray-400">
										Component metrics will appear as components render
									</div>
								</div>
							</Card>
						{/if}
					</section>

					<!-- Custom Metrics -->
					{#if report.customMetrics.length > 0}
						<section>
							<h3 class="mb-4 text-lg font-semibold text-gray-900">Custom Metrics</h3>
							<div class="overflow-x-auto">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>Metric</th
											>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>Value</th
											>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
												>Timestamp</th
											>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										{#each report.customMetrics.slice(0, 10) as metric (`${metric.name}-${metric.timestamp}`)}
											<tr>
												<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
													{metric.name}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
													{typeof metric.value === 'number'
														? formatTime(metric.value)
														: metric.value}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
													{new Date(metric.timestamp).toLocaleTimeString()}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</section>
					{/if}

					<!-- Actions -->
					<section class="border-t border-gray-200 pt-6">
						<div class="flex gap-4">
							<button
								onclick={() => performanceMonitor.clear()}
								class="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
							>
								Clear Metrics
							</button>
							<button
								onclick={() => {
									const reportData = JSON.stringify(report, null, 2);
									const blob = new Blob([reportData], { type: 'application/json' });
									const url = URL.createObjectURL(blob);
									const a = document.createElement('a');
									a.href = url;
									a.download = `performance-report-${Date.now()}.json`;
									a.click();
									URL.revokeObjectURL(url);
								}}
								class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
							>
								Export Report
							</button>
						</div>
					</section>
				</div>
			{:else}
				<div class="p-6">
					<Card>
						<div class="py-8 text-center">
							<div class="text-gray-500">Loading performance data...</div>
						</div>
					</Card>
				</div>
			{/if}
		</div>
	</div>
{/if}
