<script lang="ts">
	import { Button, Card } from '$lib/components/ui';

	// Placeholder data - will be replaced with real functionality in Block 7
	const workspaces = [
		{
			id: '1',
			name: 'Medical Scan Analysis',
			projectName: 'Medical Images Dataset',
			imageCount: 45,
			annotationType: 'Bounding Box',
			lastModified: '2024-01-22',
			progress: 75
		},
		{
			id: '2',
			name: 'Vehicle Detection Task',
			projectName: 'Vehicle Detection',
			imageCount: 120,
			annotationType: 'Classification',
			lastModified: '2024-01-21',
			progress: 30
		}
	];

	const recentAnnotations = [
		{
			id: '1',
			imageName: 'chest_xray_001.jpg',
			annotationType: 'Bounding Box',
			timestamp: '2024-01-22 14:30',
			status: 'completed'
		},
		{
			id: '2',
			imageName: 'traffic_cam_045.jpg',
			annotationType: 'Classification',
			timestamp: '2024-01-22 13:15',
			status: 'in_progress'
		}
	];
</script>

<svelte:head>
	<title>Annotations - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Annotation Workspace</h1>
			<p class="mt-2 text-gray-600">Create and manage image annotations</p>
		</div>
		<Button variant="primary">
			<span class="mr-2">✏️</span>
			New Annotation Session
		</Button>
	</div>

	<!-- Active Workspaces -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Active Workspaces</h2>
		<div class="grid gap-6 md:grid-cols-2">
			{#each workspaces as workspace (workspace.name)}
				<Card>
					{#snippet header()}
						<div class="flex items-start justify-between">
							<h3 class="text-lg font-semibold text-gray-900">{workspace.name}</h3>
							<span class="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
								{workspace.annotationType}
							</span>
						</div>
					{/snippet}

					<div class="space-y-3">
						<p class="text-sm text-gray-600">📁 {workspace.projectName}</p>
						<p class="text-sm text-gray-600">🖼️ {workspace.imageCount} images</p>
						<p class="text-sm text-gray-600">📅 Last modified: {workspace.lastModified}</p>

						<div>
							<div class="mb-1 flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">Progress</span>
								<span class="text-sm text-gray-600">{workspace.progress}%</span>
							</div>
							<div class="h-2 w-full rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full bg-green-600 transition-all duration-300"
									style="width: {workspace.progress}%"
								></div>
							</div>
						</div>

						<div class="flex space-x-2 pt-2">
							<Button variant="primary" size="sm" class="flex-1">Continue</Button>
							<Button variant="ghost" size="sm" class="flex-1">Settings</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	</div>

	<!-- Annotation Tools -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Annotation Tools</h2>
		<div class="grid gap-4 md:grid-cols-4">
			<Card>
				<div class="p-4 text-center">
					<div class="mb-2 text-3xl">📦</div>
					<h3 class="mb-1 font-medium text-gray-900">Bounding Box</h3>
					<p class="text-sm text-gray-600">Draw rectangular regions</p>
					<Button variant="ghost" size="sm" class="mt-3">Select</Button>
				</div>
			</Card>
			<Card>
				<div class="p-4 text-center">
					<div class="mb-2 text-3xl">🔺</div>
					<h3 class="mb-1 font-medium text-gray-900">Polygon</h3>
					<p class="text-sm text-gray-600">Define complex shapes</p>
					<Button variant="ghost" size="sm" class="mt-3" disabled>Coming Soon</Button>
				</div>
			</Card>
			<Card>
				<div class="p-4 text-center">
					<div class="mb-2 text-3xl">🏷️</div>
					<h3 class="mb-1 font-medium text-gray-900">Classification</h3>
					<p class="text-sm text-gray-600">Assign categories</p>
					<Button variant="ghost" size="sm" class="mt-3">Select</Button>
				</div>
			</Card>
			<Card>
				<div class="p-4 text-center">
					<div class="mb-2 text-3xl">🎯</div>
					<h3 class="mb-1 font-medium text-gray-900">Segmentation</h3>
					<p class="text-sm text-gray-600">Pixel-level masks</p>
					<Button variant="ghost" size="sm" class="mt-3" disabled>Coming Soon</Button>
				</div>
			</Card>
		</div>
	</div>

	<!-- Recent Annotations -->
	<div>
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Recent Annotations</h2>
		<Card>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Image
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Type
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Timestamp
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Status
							</th>
							<th class="relative px-6 py-3">
								<span class="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each recentAnnotations as annotation (annotation.id)}
							<tr>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
									{annotation.imageName}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="inline-flex rounded-full bg-blue-100 px-2 text-xs leading-5 font-semibold text-blue-800"
									>
										{annotation.annotationType}
									</span>
								</td>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
									{annotation.timestamp}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {annotation.status ===
										'completed'
											? 'bg-green-100 text-green-800'
											: 'bg-yellow-100 text-yellow-800'}"
									>
										{annotation.status}
									</span>
								</td>
								<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
									<a href="/annotations/{annotation.id}" class="text-blue-600 hover:text-blue-900">
										View
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	</div>

	<!-- Empty state for workspaces -->
	{#if workspaces.length === 0}
		<div class="py-12 text-center">
			<div class="mb-4 text-6xl">✏️</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">No annotation workspaces yet</h3>
			<p class="mb-6 text-gray-600">Create your first annotation session to get started</p>
			<Button variant="primary">Start Annotating</Button>
		</div>
	{/if}
</div>
