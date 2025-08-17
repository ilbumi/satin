<script lang="ts">
	import { onMount } from 'svelte';
	import { runConnectivityTests } from '$lib/core/api/test';
	import { testConnection, api } from '$lib/core/api';

	let connectionStatus = 'Testing...';
	let projectCount = 0;
	let testResults: string[] = [];

	onMount(async () => {
		// Skip API calls during testing
		if (import.meta.env.VITEST || import.meta.env.NODE_ENV === 'test') {
			connectionStatus = 'Testing Environment';
			testResults.push('🧪 Skipped API calls in test environment');
			return;
		}

		try {
			// Test basic connection
			const connected = await testConnection();
			connectionStatus = connected ? 'Connected ✅' : 'Disconnected ❌';

			// Test a simple query
			const result = await api.projects.getProjects(10, 0);
			if (result.data) {
				projectCount = result.data.projects.totalCount;
				testResults.push(`✅ Projects query successful: ${projectCount} total projects`);
			} else if (result.error) {
				testResults.push(`❌ Projects query failed: ${result.error.message}`);
			}

			// Run full connectivity tests in console
			runConnectivityTests();
		} catch (error) {
			testResults.push(`❌ Error during testing: ${error}`);
		}
	});
</script>

<div class="p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
		<p class="mt-2 text-gray-600">Welcome to Satin - Image Annotation Platform</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Connection Status Card -->
		<div class="rounded-lg border bg-white p-6 shadow-sm">
			<h2 class="mb-3 text-lg font-semibold text-gray-900">System Status</h2>
			<p class="mb-2 text-sm text-gray-600">
				Backend Connection: <span class="font-mono text-sm">{connectionStatus}</span>
			</p>
			<p class="text-sm text-gray-600">
				Total Projects: <span class="font-mono text-sm">{projectCount}</span>
			</p>
		</div>

		<!-- Quick Actions Card -->
		<div class="rounded-lg border bg-white p-6 shadow-sm">
			<h2 class="mb-3 text-lg font-semibold text-gray-900">Quick Actions</h2>
			<div class="space-y-3">
				<a href="/projects" class="block text-sm text-blue-600 hover:text-blue-800">
					📁 Manage Projects
				</a>
				<a href="/tasks" class="block text-sm text-blue-600 hover:text-blue-800"> ✅ View Tasks </a>
				<a href="/annotations" class="block text-sm text-blue-600 hover:text-blue-800">
					✏️ Start Annotating
				</a>
			</div>
		</div>

		<!-- Recent Activity Card -->
		<div class="rounded-lg border bg-white p-6 shadow-sm">
			<h2 class="mb-3 text-lg font-semibold text-gray-900">Recent Activity</h2>
			<div class="space-y-2">
				{#if testResults.length === 0}
					<p class="text-sm text-gray-500">Loading...</p>
				{:else}
					{#each testResults.slice(0, 3) as result (result)}
						<p class="font-mono text-xs text-gray-600">{result}</p>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Detailed Test Results -->
	<div class="mt-8">
		<div class="rounded-lg border bg-white shadow-sm">
			<div class="border-b border-gray-200 px-6 py-4">
				<h2 class="text-lg font-semibold text-gray-900">System Test Results</h2>
			</div>
			<div class="p-6">
				{#if testResults.length === 0}
					<p class="text-gray-500">Running tests...</p>
				{:else}
					<ul class="space-y-2">
						{#each testResults as result, index (index)}
							<li class="font-mono text-sm text-gray-700">{result}</li>
						{/each}
					</ul>
				{/if}

				<div class="mt-4 rounded bg-gray-50 p-4">
					<p class="text-sm text-gray-600">
						Check the browser console for detailed connectivity test results.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
