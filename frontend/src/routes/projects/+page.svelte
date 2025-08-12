<script lang="ts">
	import { onMount } from 'svelte';
	import { client } from '$lib/graphql/client';
	import {
		GET_PROJECTS,
		CREATE_PROJECT,
		DELETE_PROJECT,
		UPDATE_PROJECT
	} from '$lib/graphql/queries';
	import type { Project } from '$lib/graphql/types';
	import Navigation from '$lib/components/Navigation.svelte';

	let projects: Project[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showCreateModal = $state(false);
	let createLoading = $state(false);
	let createError = $state<string | null>(null);
	let projectName = $state('');
	let projectDescription = $state('');
	let showDeleteModal = $state(false);
	let projectToDelete = $state<Project | null>(null);
	let deleteLoading = $state(false);
	let deleteError = $state<string | null>(null);
	let showEditModal = $state(false);
	let projectToEdit = $state<Project | null>(null);
	let editLoading = $state(false);
	let editError = $state<string | null>(null);
	let editProjectName = $state('');
	let editProjectDescription = $state('');

	onMount(async () => {
		await loadProjects();
	});

	async function loadProjects() {
		try {
			loading = true;
			const result = await client.query(GET_PROJECTS, { limit: 20, offset: 0 }).toPromise();
			if (result.data?.projects) {
				projects = result.data.projects.objects;
			}
			if (result.error) {
				error = result.error.message;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		showCreateModal = true;
		projectName = '';
		projectDescription = '';
		createError = null;
	}

	function closeCreateModal() {
		showCreateModal = false;
		projectName = '';
		projectDescription = '';
		createError = null;
	}

	async function handleCreateProject() {
		if (!projectName.trim()) {
			createError = 'Project name is required';
			return;
		}

		try {
			createLoading = true;
			createError = null;

			const result = await client
				.mutation(CREATE_PROJECT, {
					name: projectName.trim(),
					description: projectDescription.trim()
				})
				.toPromise();

			if (result.error) {
				createError = result.error.message;
				return;
			}

			if (result.data?.createProject) {
				// Add the new project to the list
				projects = [result.data.createProject, ...projects];
				closeCreateModal();
			}
		} catch (err) {
			createError = err instanceof Error ? err.message : 'Failed to create project';
		} finally {
			createLoading = false;
		}
	}

	function createNewProject() {
		openCreateModal();
	}

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

			const result = await client
				.mutation(DELETE_PROJECT, {
					id: projectToDelete.id
				})
				.toPromise();

			if (result.error) {
				deleteError = result.error.message;
				return;
			}

			if (result.data?.deleteProject) {
				// Remove the project from the list
				projects = projects.filter((p) => p.id !== projectToDelete?.id);
				closeDeleteModal();
			}
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Failed to delete project';
		} finally {
			deleteLoading = false;
		}
	}

	function openEditModal(project: Project) {
		projectToEdit = project;
		editProjectName = project.name;
		editProjectDescription = project.description;
		showEditModal = true;
		editError = null;
	}

	function closeEditModal() {
		showEditModal = false;
		projectToEdit = null;
		editProjectName = '';
		editProjectDescription = '';
		editError = null;
	}

	async function handleEditProject() {
		if (!projectToEdit) return;

		if (!editProjectName.trim()) {
			editError = 'Project name is required';
			return;
		}

		try {
			editLoading = true;
			editError = null;

			const result = await client
				.mutation(UPDATE_PROJECT, {
					id: projectToEdit.id,
					name: editProjectName.trim(),
					description: editProjectDescription.trim()
				})
				.toPromise();

			if (result.error) {
				editError = result.error.message;
				return;
			}

			if (result.data?.updateProject) {
				// Update the project in the list
				projects = projects.map((p) =>
					p.id === projectToEdit?.id ? result.data.updateProject : p
				);
				closeEditModal();
			}
		} catch (err) {
			editError = err instanceof Error ? err.message : 'Failed to update project';
		} finally {
			editLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Projects - SATIn</title>
	<meta name="description" content="Manage your annotation projects" />
</svelte:head>

<Navigation />

<div class="projects-page">
	<header class="page-header">
		<h1>Projects</h1>
		<button class="create-button" onclick={createNewProject}>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
				<path
					d="M8 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM8 5a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 8 5Z"
				/>
			</svg>
			New Project
		</button>
	</header>

	<main class="projects-content">
		{#if loading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>Loading projects...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
					<path
						d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16ZM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646Z"
					/>
				</svg>
				<h2>Error Loading Projects</h2>
				<p>{error}</p>
				<button onclick={() => window.location.reload()}>Try Again</button>
			</div>
		{:else if projects.length === 0}
			<div class="empty-state">
				<svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor">
					<path
						d="M14 1.5A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V1.5ZM4 2.5v11A.5.5 0 0 1 3.5 13h-.5a.5.5 0 0 1-.5-.5V3a1 1 0 0 1 1-1h.5a.5.5 0 0 1 .5.5Zm8 0A.5.5 0 0 1 11.5 2h-6A.5.5 0 0 1 5 2.5v10A.5.5 0 0 1 5.5 13h6a.5.5 0 0 1 .5-.5v-10Z"
					/>
				</svg>
				<h2>No Projects Yet</h2>
				<p>Create your first annotation project to get started.</p>
				<button class="primary-button" onclick={createNewProject}>Create First Project</button>
			</div>
		{:else}
			<div class="projects-grid" data-testid="project-list">
				{#each projects as project (project.id)}
					<div class="project-card" data-testid="project-item">
						<div class="project-header">
							<h3>{project.name}</h3>
							<div class="project-actions-header">
								<button
									class="edit-button"
									onclick={() => openEditModal(project)}
									aria-label="Edit project"
								>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
										<path
											d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146ZM11.207 9.5 7 13.707V16h2.293L13.5 11.793l-2.293-2.293Zm1.586-3L14 5.293 11.707 3 10.5 4.207l2.293 2.293Z"
										/>
									</svg>
								</button>
								<button
									class="delete-button"
									onclick={() => openDeleteModal(project)}
									aria-label="Delete project"
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
						<p class="project-description">{project.description}</p>
						<div class="project-stats">
							<span class="stat">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
									<path
										d="M8 1.5A1.5 1.5 0 0 0 6.5 0h-3A1.5 1.5 0 0 0 2 1.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V1.5A1.5 1.5 0 0 0 12.5 0h-3A1.5 1.5 0 0 0 8 1.5Z"
									/>
								</svg>
								0 images
							</span>
							<span class="stat">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
									<path
										d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
									/>
								</svg>
								0 annotations
							</span>
						</div>
						<div class="project-actions">
							<a href="/projects/{project.id}" class="action-button secondary">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
									<path
										d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"
									/>
								</svg>
								Manage Images
							</a>
							<button class="action-button primary">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
									<path
										d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
									/>
								</svg>
								Annotate
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<!-- Create Project Modal -->
{#if showCreateModal}
	<div
		class="modal-overlay"
		onclick={closeCreateModal}
		onkeydown={(e) => e.key === 'Escape' && closeCreateModal()}
		role="dialog"
		tabindex="-1"
	>
		<div
			class="modal-content"
			role="presentation"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && closeCreateModal()}
		>
			<div class="modal-header">
				<h2>Create New Project</h2>
				<button class="close-button" onclick={closeCreateModal} aria-label="Close modal">
					<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
						<path
							d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
						/>
					</svg>
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateProject();
				}}
			>
				<div class="form-group">
					<label for="project-name">Project Name</label>
					<input
						id="project-name"
						type="text"
						bind:value={projectName}
						placeholder="Enter project name"
						required
						disabled={createLoading}
					/>
				</div>

				<div class="form-group">
					<label for="project-description">Description</label>
					<textarea
						id="project-description"
						bind:value={projectDescription}
						placeholder="Enter project description (optional)"
						rows="3"
						disabled={createLoading}
					></textarea>
				</div>

				{#if createError}
					<div class="error-message">
						{createError}
					</div>
				{/if}

				<div class="modal-actions">
					<button
						type="button"
						class="cancel-button"
						onclick={closeCreateModal}
						disabled={createLoading}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="submit-button"
						disabled={createLoading || !projectName.trim()}
					>
						{#if createLoading}
							<div class="button-spinner"></div>
							Creating...
						{:else}
							Create Project
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Project Confirmation Modal -->
{#if showDeleteModal && projectToDelete}
	<div
		class="modal-overlay"
		onclick={closeDeleteModal}
		onkeydown={(e) => e.key === 'Escape' && closeDeleteModal()}
		role="dialog"
		tabindex="-1"
	>
		<div
			class="modal-content"
			role="presentation"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && closeDeleteModal()}
		>
			<div class="modal-header">
				<h2>Delete Project</h2>
				<button class="close-button" onclick={closeDeleteModal} aria-label="Close modal">
					<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
						<path
							d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
						/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				<div class="warning-icon">
					<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
						<path
							d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
						/>
					</svg>
				</div>
				<h3>Are you sure you want to delete this project?</h3>
				<p>
					You're about to delete "<strong>{projectToDelete.name}</strong>". This action cannot be
					undone. All associated data, images, and annotations will be permanently removed.
				</p>

				{#if deleteError}
					<div class="error-message">
						{deleteError}
					</div>
				{/if}

				<div class="modal-actions">
					<button
						type="button"
						class="cancel-button"
						onclick={closeDeleteModal}
						disabled={deleteLoading}
					>
						Cancel
					</button>
					<button
						type="button"
						class="delete-confirm-button"
						onclick={handleDeleteProject}
						disabled={deleteLoading}
					>
						{#if deleteLoading}
							<div class="button-spinner"></div>
							Deleting...
						{:else}
							Delete Project
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Edit Project Modal -->
{#if showEditModal && projectToEdit}
	<div
		class="modal-overlay"
		onclick={closeEditModal}
		onkeydown={(e) => e.key === 'Escape' && closeEditModal()}
		role="dialog"
		tabindex="-1"
	>
		<div
			class="modal-content"
			role="presentation"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && closeEditModal()}
		>
			<div class="modal-header">
				<h2>Edit Project</h2>
				<button class="close-button" onclick={closeEditModal} aria-label="Close modal">
					<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
						<path
							d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
						/>
					</svg>
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleEditProject();
				}}
			>
				<div class="form-group">
					<label for="edit-project-name">Project Name</label>
					<input
						id="edit-project-name"
						type="text"
						bind:value={editProjectName}
						placeholder="Enter project name"
						required
						disabled={editLoading}
					/>
				</div>

				<div class="form-group">
					<label for="edit-project-description">Description</label>
					<textarea
						id="edit-project-description"
						bind:value={editProjectDescription}
						placeholder="Enter project description (optional)"
						rows="3"
						disabled={editLoading}
					></textarea>
				</div>

				{#if editError}
					<div class="error-message">
						{editError}
					</div>
				{/if}

				<div class="modal-actions">
					<button
						type="button"
						class="cancel-button"
						onclick={closeEditModal}
						disabled={editLoading}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="submit-button"
						disabled={editLoading || !editProjectName.trim()}
					>
						{#if editLoading}
							<div class="button-spinner"></div>
							Updating...
						{:else}
							Update Project
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.projects-page {
		min-height: 100vh;
		background-color: #f8fafc;
		padding: 2rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
	}

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #1e293b;
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
	}

	.create-button:hover {
		background-color: #2563eb;
	}

	.projects-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		color: #64748b;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e2e8f0;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-state svg,
	.empty-state svg {
		margin-bottom: 1rem;
		color: #94a3b8;
	}

	.error-state h2,
	.empty-state h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.error-state p,
	.empty-state p {
		margin: 0 0 1.5rem 0;
		max-width: 400px;
	}

	.primary-button {
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.primary-button:hover {
		background-color: #2563eb;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.project-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		transition: all 0.2s;
	}

	.project-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.project-header h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
		line-height: 1.3;
	}

	.project-actions-header {
		display: flex;
		gap: 0.5rem;
	}

	.edit-button,
	.delete-button {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.edit-button:hover {
		background-color: #f0f9ff;
		color: #0369a1;
	}

	.delete-button:hover {
		background-color: #fef2f2;
		color: #dc2626;
	}

	.project-description {
		color: #64748b;
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.project-stats {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: #64748b;
		font-size: 0.875rem;
	}

	.project-actions {
		display: flex;
		gap: 0.75rem;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		flex: 1;
		justify-content: center;
		text-decoration: none;
	}

	.action-button.secondary {
		background: white;
		color: #64748b;
	}

	.action-button.secondary:hover {
		background-color: #f8fafc;
		color: #1e293b;
		border-color: #cbd5e1;
	}

	.action-button.primary {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.action-button.primary:hover {
		background-color: #2563eb;
		border-color: #2563eb;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: white;
		border-radius: 12px;
		padding: 0;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 1.5rem 0 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		margin-bottom: 1.5rem;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-button:hover {
		background-color: #f1f5f9;
		color: #1e293b;
	}

	form {
		padding: 0 1.5rem 1.5rem 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group input:disabled,
	.form-group textarea:disabled {
		background-color: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}

	.form-group textarea {
		resize: vertical;
	}

	.error-message {
		background-color: #fef2f2;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
		border: 1px solid #fecaca;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.cancel-button,
	.submit-button {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.cancel-button {
		background: white;
		color: #6b7280;
		border-color: #d1d5db;
	}

	.cancel-button:hover:not(:disabled) {
		background-color: #f9fafb;
		color: #374151;
	}

	.submit-button {
		background-color: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.submit-button:hover:not(:disabled) {
		background-color: #2563eb;
		border-color: #2563eb;
	}

	.submit-button:disabled {
		background-color: #9ca3af;
		border-color: #9ca3af;
		cursor: not-allowed;
	}

	.button-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	/* Delete Modal Specific Styles */
	.modal-body {
		padding: 1.5rem;
		text-align: center;
	}

	.warning-icon {
		color: #f59e0b;
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}

	.modal-body h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 1rem 0;
	}

	.modal-body p {
		color: #64748b;
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	.delete-confirm-button {
		background-color: #dc2626;
		color: white;
		border: 1px solid #dc2626;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.delete-confirm-button:hover:not(:disabled) {
		background-color: #b91c1c;
		border-color: #b91c1c;
	}

	.delete-confirm-button:disabled {
		background-color: #9ca3af;
		border-color: #9ca3af;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.projects-page {
			padding: 1rem;
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.projects-grid {
			grid-template-columns: 1fr;
		}

		.project-actions {
			flex-direction: column;
		}

		.modal-content {
			margin: 1rem;
			max-width: none;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}

		.cancel-button,
		.submit-button {
			justify-content: center;
		}
	}
</style>
