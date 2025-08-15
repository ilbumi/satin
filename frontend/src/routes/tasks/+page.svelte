<script lang="ts">
	import { Button, Card } from '$lib/components/ui';

	// Placeholder data - will be replaced with real GraphQL queries in Block 6
	const tasks = [
		{
			id: '1',
			title: 'Annotate chest X-rays',
			projectName: 'Medical Images Dataset',
			assignee: 'Dr. Smith',
			status: 'in_progress',
			priority: 'high',
			dueDate: '2024-01-25',
			progress: 60
		},
		{
			id: '2',
			title: 'Label vehicle types',
			projectName: 'Vehicle Detection',
			assignee: 'John Doe',
			status: 'pending',
			priority: 'medium',
			dueDate: '2024-01-30',
			progress: 0
		},
		{
			id: '3',
			title: 'Classify plant diseases',
			projectName: 'Plant Disease Classification',
			assignee: 'Jane Wilson',
			status: 'completed',
			priority: 'low',
			dueDate: '2024-01-20',
			progress: 100
		}
	];

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'in_progress':
				return 'bg-yellow-100 text-yellow-800';
			case 'pending':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'high':
				return 'bg-red-100 text-red-800';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800';
			case 'low':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:head>
	<title>Tasks - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Tasks</h1>
			<p class="mt-2 text-gray-600">Manage annotation tasks and assignments</p>
		</div>
		<Button variant="primary">
			<span class="mr-2">➕</span>
			New Task
		</Button>
	</div>

	<!-- Task Filter Tabs -->
	<div class="mb-6 border-b border-gray-200">
		<nav class="flex space-x-8">
			<button class="border-b-2 border-blue-500 px-1 py-2 text-sm font-medium text-blue-600">
				All Tasks ({tasks.length})
			</button>
			<button
				class="border-b-2 border-transparent px-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
			>
				In Progress ({tasks.filter((t) => t.status === 'in_progress').length})
			</button>
			<button
				class="border-b-2 border-transparent px-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
			>
				Pending ({tasks.filter((t) => t.status === 'pending').length})
			</button>
			<button
				class="border-b-2 border-transparent px-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
			>
				Completed ({tasks.filter((t) => t.status === 'completed').length})
			</button>
		</nav>
	</div>

	<!-- Tasks Grid -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each tasks as task (task.id)}
			<Card>
				{#snippet header()}
					<div class="flex items-start justify-between">
						<h3 class="line-clamp-2 text-lg font-semibold text-gray-900">{task.title}</h3>
						<span class="rounded-full px-2 py-1 text-xs {getPriorityColor(task.priority)}">
							{task.priority}
						</span>
					</div>
				{/snippet}

				<div class="space-y-3">
					<div>
						<p class="text-sm text-gray-600">📁 {task.projectName}</p>
						<p class="text-sm text-gray-600">👤 {task.assignee}</p>
						<p class="text-sm text-gray-600">📅 Due: {task.dueDate}</p>
					</div>

					<div>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm font-medium text-gray-700">Progress</span>
							<span class="text-sm text-gray-600">{task.progress}%</span>
						</div>
						<div class="h-2 w-full rounded-full bg-gray-200">
							<div
								class="h-2 rounded-full bg-blue-600 transition-all duration-300"
								style="width: {task.progress}%"
							></div>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<span class="rounded-full px-2 py-1 text-xs {getStatusColor(task.status)}">
							{task.status.replace('_', ' ')}
						</span>
						<a href="/tasks/{task.id}" class="text-sm text-blue-600 hover:text-blue-800">
							View →
						</a>
					</div>
				</div>
			</Card>
		{/each}
	</div>

	<!-- Empty state -->
	{#if tasks.length === 0}
		<div class="py-12 text-center">
			<div class="mb-4 text-6xl">✅</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">No tasks yet</h3>
			<p class="mb-6 text-gray-600">Create your first annotation task to get started</p>
			<Button variant="primary">Create Task</Button>
		</div>
	{/if}
</div>
