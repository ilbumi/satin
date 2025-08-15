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

<div class="container mx-auto max-w-4xl p-8">
	<h1 class="mb-8 text-3xl font-bold">Satin - Image Annotation Platform</h1>

	<div class="mb-6 rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold">GraphQL Connection Status</h2>
		<p class="mb-2 text-lg">
			Backend Connection: <span class="font-mono">{connectionStatus}</span>
		</p>
		<p class="text-lg">Total Projects: <span class="font-mono">{projectCount}</span></p>
	</div>

	<div class="rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold">Test Results</h2>
		{#if testResults.length === 0}
			<p class="text-gray-500">Running tests...</p>
		{:else}
			<ul class="space-y-2">
				{#each testResults as result, index (index)}
					<li class="font-mono text-sm">{result}</li>
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
