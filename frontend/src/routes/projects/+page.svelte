<script lang="ts">
	import { Button, Card } from '$lib/components/ui';

	// Placeholder data - will be replaced with real GraphQL queries in Block 4
	const projects = [
		{
			id: '1',
			name: 'Medical Images Dataset',
			description: 'Collection of medical scans for annotation',
			imageCount: 150,
			status: 'active'
		},
		{
			id: '2',
			name: 'Vehicle Detection',
			description: 'Traffic camera images for vehicle detection training',
			imageCount: 892,
			status: 'active'
		},
		{
			id: '3',
			name: 'Plant Disease Classification',
			description: 'Agricultural images for plant disease identification',
			imageCount: 456,
			status: 'completed'
		}
	];
</script>

<svelte:head>
	<title>Projects - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Projects</h1>
			<p class="mt-2 text-gray-600">Manage your annotation projects</p>
		</div>
		<Button variant="primary">
			<span class="mr-2">➕</span>
			New Project
		</Button>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each projects as project (project.id)}
			<Card>
				{#snippet header()}
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900">{project.name}</h3>
						<span
							class="rounded-full px-2 py-1 text-xs {project.status === 'active'
								? 'bg-green-100 text-green-800'
								: 'bg-gray-100 text-gray-800'}"
						>
							{project.status}
						</span>
					</div>
				{/snippet}

				<p class="mb-4 text-gray-600">{project.description}</p>
				<div class="flex items-center justify-between text-sm text-gray-500">
					<span>📷 {project.imageCount} images</span>
					<a href="/projects/{project.id}" class="text-blue-600 hover:text-blue-800"> View → </a>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Empty state for when no projects exist -->
	{#if projects.length === 0}
		<div class="py-12 text-center">
			<div class="mb-4 text-6xl">📁</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">No projects yet</h3>
			<p class="mb-6 text-gray-600">Create your first annotation project to get started</p>
			<Button variant="primary">Create Project</Button>
		</div>
	{/if}
</div>
