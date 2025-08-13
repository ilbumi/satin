<script lang="ts">
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import BaseModal from '$lib/components/ui/BaseModal.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import ProjectForm from '$lib/components/forms/ProjectForm.svelte';
	import { projectService } from '$lib/services';
	import type { Project, ProjectFormData } from '$lib/types';

	// Main state
	let projects: Project[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Search and filtering
	let searchTerm = $state('');
	let sortBy = $state<'name' | 'created'>('name');

	// Create modal state
	let showCreateModal = $state(false);
	let createLoading = $state(false);
	let createError = $state<string | null>(null);

	// Edit modal state
	let showEditModal = $state(false);
	let projectToEdit = $state<Project | null>(null);
	let editLoading = $state(false);
	let editError = $state<string | null>(null);

	// Delete modal state
	let showDeleteModal = $state(false);
	let projectToDelete = $state<Project | null>(null);
	let deleteLoading = $state(false);
	let deleteError = $state<string | null>(null);

	// Computed filtered and sorted projects
	const filteredAndSortedProjects = $derived.by(() => {
		return projectService.filterProjects(projects, searchTerm, sortBy);
	});

	onMount(async () => {
		await loadProjects();
	});

	async function loadProjects() {
		try {
			loading = true;
			error = null;
			const result = await projectService.getProjects({ limit: 20, offset: 0 });
			projects = result.objects;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load projects';
		} finally {
			loading = false;
		}
	}

	// Create modal handlers
	function openCreateModal() {
		showCreateModal = true;
		createError = null;
	}

	function closeCreateModal() {
		showCreateModal = false;
		createError = null;
	}

	async function handleCreateProject(formData: ProjectFormData) {
		try {
			createLoading = true;
			createError = null;
			const newProject = await projectService.createProject(formData);
			projects = [...projects, newProject];
			closeCreateModal();
		} catch (err) {
			createError = err instanceof Error ? err.message : 'Failed to create project';
		} finally {
			createLoading = false;
		}
	}

	// Edit modal handlers
	function openEditModal(project: Project) {
		projectToEdit = project;
		showEditModal = true;
		editError = null;
	}

	function closeEditModal() {
		showEditModal = false;
		projectToEdit = null;
		editError = null;
	}

	async function handleEditProject(formData: ProjectFormData) {
		if (!projectToEdit) return;

		try {
			editLoading = true;
			editError = null;
			const updatedProject = await projectService.updateProject(projectToEdit.id, formData);
			projects = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
			closeEditModal();
		} catch (err) {
			editError = err instanceof Error ? err.message : 'Failed to update project';
		} finally {
			editLoading = false;
		}
	}

	// Delete modal handlers
	function openDeleteModal(project: Project) {
		projectToDelete = project;
		showDeleteModal = true;
		deleteError = null;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		projectToDelete = null;
		deleteError = null;
	}

	async function handleDeleteProject() {
		if (!projectToDelete) return;

		try {
			deleteLoading = true;
			deleteError = null;
			await projectService.deleteProject(projectToDelete.id);
			projects = projects.filter((p) => p.id !== projectToDelete!.id);
			closeDeleteModal();
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Failed to delete project';
		} finally {
			deleteLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Projects - SATIn</title>
	<meta name="description" content="Manage your annotation projects" />
</svelte:head>

<Navigation />

<div class="projects-page">
	<div class="page-header">
		<div class="header-content">
			<h1>Projects</h1>
			<p>Manage your annotation projects and organize your work.</p>
		</div>
		<button class="create-button" onclick={openCreateModal} data-testid="create-project-btn">
			<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
				<path
					d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"
				/>
			</svg>
			Create Project
		</button>
	</div>

	<main class="main-content">
		{#if loading}
			<div class="loading-state">
				<LoadingSpinner size="large" />
				<p>Loading projects...</p>
			</div>
		{:else if error}
			<ErrorMessage message={error} variant="page" />
		{:else}
			<!-- Search and Filter Controls -->
			<div class="controls">
				<div class="search-wrapper">
					<input
						type="text"
						placeholder="Search projects..."
						bind:value={searchTerm}
						class="search-input"
						data-testid="search-input"
					/>
					<svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path
							d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"
						/>
					</svg>
				</div>

				<select bind:value={sortBy} class="sort-select" data-testid="sort-select">
					<option value="name">Sort by Name</option>
					<option value="created">Sort by Created</option>
				</select>
			</div>

			<!-- Projects Grid -->
			{#if filteredAndSortedProjects.length === 0}
				{#if searchTerm.trim()}
					<div class="empty-state">
						<h2>No projects found</h2>
						<p>No projects match your search criteria.</p>
						<button class="clear-button" onclick={() => (searchTerm = '')}>Clear Search</button>
					</div>
				{:else}
					<div class="empty-state">
						<h2>No projects yet</h2>
						<p>Create your first project to get started with image annotation.</p>
						<button class="create-button" onclick={openCreateModal}
							>Create Your First Project</button
						>
					</div>
				{/if}
			{:else}
				<div class="projects-grid" data-testid="projects-grid">
					{#each filteredAndSortedProjects as project (project.id)}
						<div class="project-card" data-testid="project-card">
							<div class="card-header">
								<h3>
									<a href="/projects/{project.id}" data-testid="project-link">
										{project.name}
									</a>
								</h3>
								<div class="card-actions">
									<button
										class="action-button"
										onclick={() => openEditModal(project)}
										aria-label="Edit project"
										data-testid="edit-project-btn"
									>
										<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
											<path
												d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L9.708 9H9a.5.5 0 0 1-.5-.5v-.708L14.646.146zM3 2a1 1 0 0 1 1-1h6.5a.5.5 0 0 1 0 1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7.5a.5.5 0 0 1 1 0V13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3z"
											/>
										</svg>
									</button>
									<button
										class="action-button delete"
										onclick={() => openDeleteModal(project)}
										aria-label="Delete project"
										data-testid="delete-project-btn"
									>
										<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
											<path
												d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
											/>
											<path
												fill-rule="evenodd"
												d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
											/>
										</svg>
									</button>
								</div>
							</div>

							{#if project.description}
								<p class="card-description">{project.description}</p>
							{/if}

							<div class="card-footer">
								<a href="/projects/{project.id}" class="view-button">View Project</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</main>
</div>

<!-- Create Project Modal -->
<BaseModal show={showCreateModal} title="Create New Project" onClose={closeCreateModal}>
	<ProjectForm
		mode="create"
		isLoading={createLoading}
		error={createError}
		onSubmit={handleCreateProject}
		onCancel={closeCreateModal}
	/>
</BaseModal>

<!-- Edit Project Modal -->
<BaseModal show={showEditModal} title="Edit Project" onClose={closeEditModal}>
	{#if projectToEdit}
		<ProjectForm
			mode="edit"
			initialName={projectToEdit.name}
			initialDescription={projectToEdit.description}
			isLoading={editLoading}
			error={editError}
			onSubmit={handleEditProject}
			onCancel={closeEditModal}
		/>
	{/if}
</BaseModal>

<!-- Delete Confirmation Modal -->
<ConfirmModal
	show={showDeleteModal}
	title="Delete Project"
	message="You're about to delete {projectToDelete?.name ||
		''}. This action cannot be undone. All associated data, images, and annotations will be permanently removed."
	confirmText="Delete Project"
	isLoading={deleteLoading}
	error={deleteError}
	onConfirm={handleDeleteProject}
	onCancel={closeDeleteModal}
/>

<style>
	.projects-page {
		min-height: 100vh;
		background-color: #f8fafc;
	}

	.page-header {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 2rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.header-content h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.header-content p {
		color: #64748b;
		margin: 0;
	}

	.create-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		white-space: nowrap;
	}

	.create-button:hover {
		background-color: #2563eb;
	}

	.main-content {
		padding: 2rem 1.5rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		text-align: center;
		color: #64748b;
		gap: 1rem;
	}

	.controls {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		align-items: center;
	}

	.search-wrapper {
		position: relative;
		flex: 1;
		max-width: 400px;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 0.75rem 0.75rem 2.5rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		box-sizing: border-box;
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		color: #9ca3af;
		pointer-events: none;
	}

	.sort-select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 0.875rem;
		background: white;
		min-width: 150px;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.project-card {
		background: white;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		padding: 1.5rem;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.project-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.card-header h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		flex: 1;
		margin-right: 1rem;
	}

	.card-header a {
		color: #1e293b;
		text-decoration: none;
	}

	.card-header a:hover {
		color: #3b82f6;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-button {
		padding: 0.5rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		background: #f1f5f9;
		color: #64748b;
	}

	.action-button:hover {
		background: #e2e8f0;
		color: #1e293b;
	}

	.action-button.delete:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	.card-description {
		color: #64748b;
		line-height: 1.5;
		margin: 0 0 1.5rem 0;
	}

	.card-footer {
		border-top: 1px solid #f1f5f9;
		padding-top: 1rem;
	}

	.view-button {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.view-button:hover {
		color: #2563eb;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
		text-align: center;
		color: #64748b;
		gap: 1rem;
	}

	.empty-state h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.empty-state p {
		margin: 0;
		max-width: 400px;
	}

	.clear-button {
		padding: 0.75rem 1.5rem;
		background: #f1f5f9;
		color: #64748b;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.clear-button:hover {
		background: #e2e8f0;
		color: #1e293b;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.controls {
			flex-direction: column;
			align-items: stretch;
		}

		.search-wrapper {
			max-width: none;
		}

		.projects-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
