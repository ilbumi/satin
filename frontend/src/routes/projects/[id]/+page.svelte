<script lang="ts">
	import { page } from '$app/state';
	import { Button, Card } from '$lib/components/ui';

	// Get project ID from the route parameters
	const projectId = page.params.id;

	// Placeholder data - will be replaced with real GraphQL queries in Block 4
	const project = {
		id: projectId,
		name: 'Medical Images Dataset',
		description: 'Collection of medical scans for annotation',
		imageCount: 150,
		status: 'active',
		createdAt: '2024-01-15',
		updatedAt: '2024-01-20'
	};

	const recentImages = [
		{ id: '1', filename: 'scan_001.jpg', status: 'annotated', thumbnail: '' },
		{ id: '2', filename: 'scan_002.jpg', status: 'pending', thumbnail: '' },
		{ id: '3', filename: 'scan_003.jpg', status: 'in_progress', thumbnail: '' }
	];
</script>

<svelte:head>
	<title>{project.name} - Projects - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">{project.name}</h1>
			<p class="mt-2 text-gray-600">{project.description}</p>
		</div>
		<div class="flex space-x-3">
			<Button variant="secondary">Edit Project</Button>
			<Button variant="primary">
				<span class="mr-2">📷</span>
				Add Images
			</Button>
		</div>
	</div>

	<!-- Project Stats -->
	<div class="mb-8 grid gap-6 md:grid-cols-4">
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-900">{project.imageCount}</div>
				<div class="text-sm text-gray-600">Total Images</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-green-600">85</div>
				<div class="text-sm text-gray-600">Annotated</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-yellow-600">42</div>
				<div class="text-sm text-gray-600">In Progress</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-400">23</div>
				<div class="text-sm text-gray-600">Pending</div>
			</div>
		</Card>
	</div>

	<!-- Recent Images -->
	<Card>
		{#snippet header()}
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">Recent Images</h2>
				<a href="/images?project={projectId}" class="text-blue-600 hover:text-blue-800">
					View all →
				</a>
			</div>
		{/snippet}

		<div class="grid gap-4 md:grid-cols-3">
			{#each recentImages as image (image.id)}
				<div class="rounded-lg border p-4 hover:bg-gray-50">
					<div class="mb-3 flex aspect-video items-center justify-center rounded bg-gray-200">
						<span class="text-gray-500">🖼️</span>
					</div>
					<h3 class="mb-1 font-medium text-gray-900">{image.filename}</h3>
					<span
						class="rounded-full px-2 py-1 text-xs {image.status === 'annotated'
							? 'bg-green-100 text-green-800'
							: image.status === 'in_progress'
								? 'bg-yellow-100 text-yellow-800'
								: 'bg-gray-100 text-gray-800'}"
					>
						{image.status.replace('_', ' ')}
					</span>
				</div>
			{/each}
		</div>
	</Card>

	<!-- Project Details -->
	<div class="mt-8">
		<Card>
			{#snippet header()}
				<h2 class="text-xl font-semibold text-gray-900">Project Details</h2>
			{/snippet}

			<dl class="grid gap-4 md:grid-cols-2">
				<div>
					<dt class="text-sm font-medium text-gray-500">Project ID</dt>
					<dd class="font-mono text-sm text-gray-900">{project.id}</dd>
				</div>
				<div>
					<dt class="text-sm font-medium text-gray-500">Status</dt>
					<dd class="text-sm">
						<span class="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
							{project.status}
						</span>
					</dd>
				</div>
				<div>
					<dt class="text-sm font-medium text-gray-500">Created</dt>
					<dd class="text-sm text-gray-900">{project.createdAt}</dd>
				</div>
				<div>
					<dt class="text-sm font-medium text-gray-500">Last Updated</dt>
					<dd class="text-sm text-gray-900">{project.updatedAt}</dd>
				</div>
			</dl>
		</Card>
	</div>
</div>
