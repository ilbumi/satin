<script lang="ts">
	import { Button, Card, Select, type SelectOption } from '$lib/components/ui';

	// Placeholder data - will be replaced with real GraphQL queries in Block 5
	const images = [
		{
			id: '1',
			filename: 'chest_xray_001.jpg',
			projectName: 'Medical Images Dataset',
			status: 'annotated',
			uploadedAt: '2024-01-15',
			fileSize: '2.3 MB',
			dimensions: '1024x768'
		},
		{
			id: '2',
			filename: 'traffic_cam_045.jpg',
			projectName: 'Vehicle Detection',
			status: 'pending',
			uploadedAt: '2024-01-18',
			fileSize: '1.8 MB',
			dimensions: '1920x1080'
		},
		{
			id: '3',
			filename: 'leaf_sample_023.jpg',
			projectName: 'Plant Disease Classification',
			status: 'in_progress',
			uploadedAt: '2024-01-20',
			fileSize: '3.1 MB',
			dimensions: '2048x1536'
		}
	];

	const filterOptions: SelectOption[] = [
		{ value: 'all', label: 'All Images' },
		{ value: 'annotated', label: 'Annotated' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'pending', label: 'Pending' }
	];

	let selectedFilter = $state('all');
	let searchQuery = $state('');

	function getStatusColor(status: string) {
		switch (status) {
			case 'annotated':
				return 'bg-green-100 text-green-800';
			case 'in_progress':
				return 'bg-yellow-100 text-yellow-800';
			case 'pending':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:head>
	<title>Images - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Images</h1>
			<p class="mt-2 text-gray-600">Browse and manage your image collection</p>
		</div>
		<Button variant="primary">
			<span class="mr-2">📤</span>
			Upload Images
		</Button>
	</div>

	<!-- Filters and Search -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row">
		<div class="flex-1">
			<input
				type="text"
				placeholder="Search images..."
				bind:value={searchQuery}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>
		<div class="sm:w-48">
			<Select options={filterOptions} bind:value={selectedFilter} placeholder="Filter by status" />
		</div>
	</div>

	<!-- Stats -->
	<div class="mb-8 grid gap-6 md:grid-cols-4">
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-900">{images.length}</div>
				<div class="text-sm text-gray-600">Total Images</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-green-600">
					{images.filter((img) => img.status === 'annotated').length}
				</div>
				<div class="text-sm text-gray-600">Annotated</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-yellow-600">
					{images.filter((img) => img.status === 'in_progress').length}
				</div>
				<div class="text-sm text-gray-600">In Progress</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-400">
					{images.filter((img) => img.status === 'pending').length}
				</div>
				<div class="text-sm text-gray-600">Pending</div>
			</div>
		</Card>
	</div>

	<!-- Image Grid -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each images as image (image.id)}
			<Card>
				<div class="mb-4 flex aspect-video items-center justify-center rounded-lg bg-gray-200">
					<span class="text-4xl text-gray-400">🖼️</span>
				</div>

				<div class="space-y-2">
					<h3 class="truncate font-medium text-gray-900" title={image.filename}>
						{image.filename}
					</h3>

					<p class="text-sm text-gray-600">📁 {image.projectName}</p>

					<div class="flex items-center justify-between">
						<span class="rounded-full px-2 py-1 text-xs {getStatusColor(image.status)}">
							{image.status.replace('_', ' ')}
						</span>
						<span class="text-xs text-gray-500">{image.fileSize}</span>
					</div>

					<div class="flex items-center justify-between text-xs text-gray-500">
						<span>{image.dimensions}</span>
						<span>{image.uploadedAt}</span>
					</div>

					<div class="border-t border-gray-100 pt-2">
						<div class="flex space-x-2">
							<Button variant="ghost" size="sm" class="flex-1">View</Button>
							<Button variant="ghost" size="sm" class="flex-1">Annotate</Button>
						</div>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Empty state -->
	{#if images.length === 0}
		<div class="py-12 text-center">
			<div class="mb-4 text-6xl">🖼️</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">No images yet</h3>
			<p class="mb-6 text-gray-600">Upload your first images to start annotating</p>
			<Button variant="primary">Upload Images</Button>
		</div>
	{/if}
</div>
