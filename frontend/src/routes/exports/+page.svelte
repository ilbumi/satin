<script lang="ts">
	import { Button, Card, Select, type SelectOption } from '$lib/components/ui';

	// Placeholder data - will be replaced with real functionality in Block 10
	const exports = [
		{
			id: '1',
			name: 'Medical Dataset Export',
			projectName: 'Medical Images Dataset',
			format: 'COCO JSON',
			status: 'completed',
			createdAt: '2024-01-22',
			fileSize: '15.2 MB',
			downloadUrl: '#'
		},
		{
			id: '2',
			name: 'Vehicle Annotations',
			projectName: 'Vehicle Detection',
			format: 'YOLO TXT',
			status: 'processing',
			createdAt: '2024-01-22',
			fileSize: '8.7 MB',
			downloadUrl: null
		},
		{
			id: '3',
			name: 'Plant Classification Data',
			projectName: 'Plant Disease Classification',
			format: 'Pascal VOC XML',
			status: 'failed',
			createdAt: '2024-01-21',
			fileSize: null,
			downloadUrl: null,
			error: 'Invalid annotation format'
		}
	];

	const formatOptions: SelectOption[] = [
		{ value: 'coco', label: 'COCO JSON' },
		{ value: 'yolo', label: 'YOLO TXT' },
		{ value: 'pascal', label: 'Pascal VOC XML' },
		{ value: 'csv', label: 'CSV' }
	];

	let selectedFormat = $state('coco');
	let selectedProject = $state('');

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'processing':
				return 'bg-yellow-100 text-yellow-800';
			case 'failed':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'completed':
				return '✅';
			case 'processing':
				return '⏳';
			case 'failed':
				return '❌';
			default:
				return '📄';
		}
	}
</script>

<svelte:head>
	<title>Exports - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Data Exports</h1>
			<p class="mt-2 text-gray-600">Export your annotations in various formats</p>
		</div>
		<Button variant="primary">
			<span class="mr-2">📤</span>
			New Export
		</Button>
	</div>

	<!-- Export Creation Form -->
	<Card class="mb-8">
		{#snippet header()}
			<h2 class="text-xl font-semibold text-gray-900">Create New Export</h2>
		{/snippet}

		<div class="grid gap-6 md:grid-cols-3">
			<div>
				<label for="project-select" class="mb-2 block text-sm font-medium text-gray-700">
					Project
				</label>
				<select
					id="project-select"
					bind:value={selectedProject}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
				>
					<option value="">Select a project</option>
					<option value="medical">Medical Images Dataset</option>
					<option value="vehicle">Vehicle Detection</option>
					<option value="plant">Plant Disease Classification</option>
				</select>
			</div>

			<div>
				<label for="format-select" class="mb-2 block text-sm font-medium text-gray-700">
					Export Format
				</label>
				<Select options={formatOptions} bind:value={selectedFormat} placeholder="Select format" />
			</div>

			<div class="flex items-end">
				<Button variant="primary" class="w-full">Create Export</Button>
			</div>
		</div>
	</Card>

	<!-- Export Stats -->
	<div class="mb-8 grid gap-6 md:grid-cols-4">
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-900">{exports.length}</div>
				<div class="text-sm text-gray-600">Total Exports</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-green-600">
					{exports.filter((exp) => exp.status === 'completed').length}
				</div>
				<div class="text-sm text-gray-600">Completed</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-yellow-600">
					{exports.filter((exp) => exp.status === 'processing').length}
				</div>
				<div class="text-sm text-gray-600">Processing</div>
			</div>
		</Card>
		<Card>
			<div class="text-center">
				<div class="text-2xl font-bold text-red-600">
					{exports.filter((exp) => exp.status === 'failed').length}
				</div>
				<div class="text-sm text-gray-600">Failed</div>
			</div>
		</Card>
	</div>

	<!-- Export History -->
	<Card>
		{#snippet header()}
			<h2 class="text-xl font-semibold text-gray-900">Export History</h2>
		{/snippet}

		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Export Name
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Project
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Format
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Status
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Created
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Size
						</th>
						<th class="relative px-6 py-3">
							<span class="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each exports as exportItem (exportItem.id)}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<span class="mr-2 text-lg">{getStatusIcon(exportItem.status)}</span>
									<span class="text-sm font-medium text-gray-900">{exportItem.name}</span>
								</div>
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{exportItem.projectName}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full bg-blue-100 px-2 text-xs leading-5 font-semibold text-blue-800"
								>
									{exportItem.format}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {getStatusColor(
										exportItem.status
									)}"
								>
									{exportItem.status}
								</span>
								{#if exportItem.error}
									<p class="mt-1 text-xs text-red-600">{exportItem.error}</p>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{exportItem.createdAt}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{exportItem.fileSize || '-'}
							</td>
							<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
								{#if exportItem.status === 'completed' && exportItem.downloadUrl}
									<a href={exportItem.downloadUrl} class="mr-4 text-blue-600 hover:text-blue-900">
										Download
									</a>
								{/if}
								{#if exportItem.status === 'failed'}
									<button class="mr-4 text-blue-600 hover:text-blue-900"> Retry </button>
								{/if}
								<button class="text-red-600 hover:text-red-900"> Delete </button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Empty state -->
	{#if exports.length === 0}
		<div class="py-12 text-center">
			<div class="mb-4 text-6xl">📤</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">No exports yet</h3>
			<p class="mb-6 text-gray-600">Create your first data export to download annotations</p>
			<Button variant="primary">Create Export</Button>
		</div>
	{/if}
</div>
