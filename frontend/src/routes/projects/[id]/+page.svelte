<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Button, Card, Spinner, Toast, Modal } from '$lib/components/ui';
	// Dynamic imports for heavy components
	let EditProjectModal:
		| typeof import('$lib/components/projects/EditProjectModal.svelte').default
		| null = $state(null);
	let AddImageByUrl: typeof import('$lib/components/images/AddImageByUrl.svelte').default | null =
		$state(null);
	let AddImageByFile: typeof import('$lib/components/images/AddImageByFile.svelte').default | null =
		$state(null);
	import { projectService } from '$lib/features/projects/service';
	import { imageService } from '$lib/features/images/service';
	import { TaskService } from '$lib/features/tasks/service';

	// Create service instances
	const taskService = new TaskService();
	import type { Project } from '$lib/graphql/generated/graphql';
	import type { UpdateProjectForm, ProjectSummary } from '$lib/features/projects/types';
	import type { ImageDetail } from '$lib/features/images/types';

	// Get project ID from the route parameters
	const projectId = page.params.id;

	let project = $state<Project | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showEditModal = $state(false);
	let showAddImageModal = $state(false);
	let showToast = $state(false);
	let uploadMethod = $state<'url' | 'file'>('url');
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error'>('success');
	let projectImages = $state<ImageDetail[]>([]);
	let loadingImages = $state(false);

	function showSuccessToast(message: string) {
		toastMessage = message;
		toastType = 'success';
		showToast = true;
	}

	function showErrorToast(message: string) {
		toastMessage = message;
		toastType = 'error';
		showToast = true;
	}

	async function loadProject() {
		try {
			loading = true;
			error = null;

			if (!projectId) {
				error = 'Project ID is required';
				return;
			}

			project = await projectService.getProject(projectId);

			if (!project) {
				error = 'Project not found';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load project';
			console.error('Failed to load project:', err);
		} finally {
			loading = false;
		}
	}

	async function handleEditProject() {
		if (!EditProjectModal) {
			try {
				const module = await import('$lib/components/projects/EditProjectModal.svelte');
				EditProjectModal = module.default;
			} catch (error) {
				console.error('Failed to load EditProjectModal:', error);
				return;
			}
		}
		showEditModal = true;
	}

	async function handleEditSubmit(data: UpdateProjectForm) {
		try {
			const updatedProject = await projectService.updateProject(data);
			if (updatedProject) {
				project = updatedProject;
				showSuccessToast('Project updated successfully');
			} else {
				showErrorToast('Failed to update project');
			}
		} catch (error) {
			showErrorToast(error instanceof Error ? error.message : 'Failed to update project');
			throw error; // Re-throw to keep modal open
		}
	}

	function handleCloseEditModal() {
		showEditModal = false;
	}

	async function handleAddImages() {
		if (!AddImageByUrl || !AddImageByFile) {
			try {
				const [urlModule, fileModule] = await Promise.all([
					import('$lib/components/images/AddImageByUrl.svelte'),
					import('$lib/components/images/AddImageByFile.svelte')
				]);
				AddImageByUrl = urlModule.default;
				AddImageByFile = fileModule.default;
			} catch (error) {
				console.error('Failed to load image upload components:', error);
				return;
			}
		}
		showAddImageModal = true;
	}

	async function handleAddImageSuccess(images: ImageDetail[]) {
		if (!project) return;

		try {
			// Create tasks for each image to link them to the project
			const taskPromises = images.map((image) =>
				taskService.createTask({
					imageId: image.id,
					projectId: project!.id,
					status: 'DRAFT'
				})
			);

			await Promise.all(taskPromises);
			showAddImageModal = false;
			showSuccessToast(`${images.length} image${images.length > 1 ? 's' : ''} added to project`);

			// Refresh images display
			loadProjectImages();
		} catch (error) {
			showErrorToast('Failed to add images to project');
			console.error('Failed to create tasks for images:', error);
		}
	}

	function handleAddImageError(error: string) {
		showErrorToast(error);
	}

	async function loadProjectImages() {
		if (!projectId) return;

		try {
			loadingImages = true;
			// Get tasks for this project and extract images
			const result = await taskService.getTasks(100, 0, { projectId });
			const imagePromises = result.objects.map((task) => imageService.getImage(task.image.id));
			const images = await Promise.all(imagePromises);
			projectImages = images.filter((img) => img !== null) as ImageDetail[];
		} catch (error) {
			console.error('Failed to load project images:', error);
		} finally {
			loadingImages = false;
		}
	}

	async function handleDeleteProject() {
		if (!project) return;

		if (
			!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)
		) {
			return;
		}

		try {
			const success = await projectService.deleteProject(project.id);
			if (success) {
				showSuccessToast('Project deleted successfully');
				// Redirect to projects list after a delay
				setTimeout(() => {
					window.location.href = '/projects';
				}, 2000);
			} else {
				showErrorToast('Failed to delete project');
			}
		} catch (error) {
			showErrorToast(error instanceof Error ? error.message : 'Failed to delete project');
		}
	}

	// Load project on mount
	onMount(() => {
		loadProject();
		loadProjectImages();
	});

	// Reactive project summary for the edit modal
	const projectSummary = $derived<ProjectSummary | null>(
		project
			? {
					id: project.id,
					name: project.name,
					description: project.description,
					status: 'active' // Default since it's not in the backend model yet
				}
			: null
	);
</script>

<svelte:head>
	<title>{project?.name || 'Project'} - Projects - Satin</title>
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<Spinner size="lg" />
		<span class="ml-3 text-gray-600">Loading project...</span>
	</div>
{:else if error}
	<div class="p-6">
		<div class="rounded-md border border-red-200 bg-red-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<span class="text-red-400">⚠️</span>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error loading project</h3>
					<div class="mt-2 text-sm text-red-700">{error}</div>
					<div class="mt-4">
						<Button variant="secondary" size="sm" onclick={loadProject}>Try Again</Button>
						<Button variant="secondary" size="sm" onclick={() => window.history.back()}>
							Go Back
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if project}
	<div class="p-6">
		<div class="mb-8 flex items-center justify-between">
			<div>
				<nav class="mb-4 flex items-center space-x-2 text-sm text-gray-500">
					<a href="/projects" class="hover:text-gray-700">Projects</a>
					<span>→</span>
					<span class="font-medium text-gray-900">{project.name}</span>
				</nav>
				<h1 class="text-3xl font-bold text-gray-900">{project.name}</h1>
				<p class="mt-2 text-gray-600">{project.description}</p>
			</div>
			<div class="flex space-x-3">
				<Button variant="secondary" onclick={handleEditProject}>Edit Project</Button>
				<Button variant="danger" onclick={handleDeleteProject}>Delete Project</Button>
				<Button variant="primary" onclick={handleAddImages}>
					<span class="mr-2">📷</span>
					Add Images
				</Button>
			</div>
		</div>

		<!-- Project Stats -->
		<div class="mb-8 grid gap-6 md:grid-cols-4">
			<Card>
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-900">{projectImages.length}</div>
					<div class="text-sm text-gray-600">Total Images</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-2xl font-bold text-green-600">0</div>
					<div class="text-sm text-gray-600">Annotated</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-2xl font-bold text-yellow-600">0</div>
					<div class="text-sm text-gray-600">In Progress</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-2xl font-bold text-gray-400">0</div>
					<div class="text-sm text-gray-600">Pending</div>
				</div>
			</Card>
		</div>

		<!-- Images Section -->
		<Card>
			{#snippet header()}
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold text-gray-900">Images</h2>
					<a href="/images?project={projectId}" class="text-blue-600 hover:text-blue-800">
						View all →
					</a>
				</div>
			{/snippet}

			{#if loadingImages}
				<div class="flex items-center justify-center py-12">
					<Spinner size="md" />
					<span class="ml-3 text-gray-600">Loading images...</span>
				</div>
			{:else if projectImages.length === 0}
				<div class="py-12 text-center">
					<div class="mb-4 text-6xl">🖼️</div>
					<h3 class="mb-2 text-lg font-medium text-gray-900">No images yet</h3>
					<p class="mb-6 text-gray-600">Add images by URL to start annotating</p>
					<Button variant="primary" onclick={handleAddImages}>
						<span class="mr-2">📷</span>
						Add Images
					</Button>
				</div>
			{:else}
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each projectImages as image (image.id)}
						<div class="rounded-lg border bg-white p-4">
							<div class="mb-3 aspect-video overflow-hidden rounded bg-gray-100">
								<img
									src={image.thumbnailUrl || image.url}
									alt={image.filename}
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
							<p class="truncate text-sm font-medium text-gray-900">{image.filename}</p>
						</div>
					{/each}
				</div>
			{/if}
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
								Active
							</span>
						</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Project Name</dt>
						<dd class="text-sm text-gray-900">{project.name}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium text-gray-500">Description</dt>
						<dd class="text-sm text-gray-900">{project.description}</dd>
					</div>
				</dl>
			</Card>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
{#if EditProjectModal && showEditModal}
	<EditProjectModal
		open={showEditModal}
		project={projectSummary}
		onClose={handleCloseEditModal}
		onSubmit={handleEditSubmit}
	/>
{/if}

<!-- Add Images Modal -->
<Modal bind:open={showAddImageModal} title="Add Images" size="lg" closeOnBackdropClick={true}>
	<div class="mb-6">
		<!-- Upload method tabs -->
		<div class="flex border-b border-gray-200">
			<button
				class="border-b-2 px-4 py-2 text-sm font-medium transition-colors {uploadMethod === 'url'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
				onclick={() => (uploadMethod = 'url')}
			>
				🌐 From URL
			</button>
			<button
				class="border-b-2 px-4 py-2 text-sm font-medium transition-colors {uploadMethod === 'file'
					? 'border-blue-500 text-blue-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
				onclick={() => (uploadMethod = 'file')}
			>
				📁 Upload Files
			</button>
		</div>
	</div>

	{#if uploadMethod === 'url' && AddImageByUrl}
		<AddImageByUrl multiple={true} onAdd={handleAddImageSuccess} onError={handleAddImageError} />
	{:else if uploadMethod === 'file' && AddImageByFile}
		<AddImageByFile multiple={true} onAdd={handleAddImageSuccess} onError={handleAddImageError} />
	{:else}
		<div class="flex items-center justify-center py-8">
			<div class="animate-pulse text-gray-600">Loading upload components...</div>
		</div>
	{/if}
</Modal>

<!-- Toast Notifications -->
{#if showToast}
	<Toast
		type={toastType}
		title={toastType === 'success' ? 'Success' : 'Error'}
		message={toastMessage}
		onClose={() => (showToast = false)}
		persistent={false}
		duration={4000}
	/>
{/if}
