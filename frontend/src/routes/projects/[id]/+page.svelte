<script lang="ts">
	import { page } from '$app/stores';
	import { client } from '$lib/graphql/client';
	import { GET_PROJECT, GET_IMAGES, CREATE_IMAGE, DELETE_IMAGE } from '$lib/graphql/queries';
	import type { Project, Image } from '$lib/graphql/types';
	import Navigation from '$lib/components/Navigation.svelte';

	let project: Project | null = $state(null);
	let images: Image[] = $state([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let imagesLoading = $state(false);
	let imagesError = $state<string | null>(null);

	// Add image modal state
	let showAddImageModal = $state(false);
	let addImageLoading = $state(false);
	let addImageError = $state<string | null>(null);
	let imageUrl = $state('');

	// Delete image state
	let imageToDelete = $state<Image | null>(null);
	let showDeleteImageModal = $state(false);
	let deleteImageLoading = $state(false);
	let deleteImageError = $state<string | null>(null);

	$effect(() => {
		const projectId = $page.params.id;
		if (projectId) {
			loadProject(projectId);
			loadImages();
		}
	});

	async function loadProject(id: string) {
		try {
			loading = true;
			const result = await client.query(GET_PROJECT, { id }).toPromise();
			if (result.data?.project) {
				project = result.data.project;
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

	async function loadImages() {
		try {
			imagesLoading = true;
			const result = await client.query(GET_IMAGES, { limit: 50, offset: 0 }).toPromise();
			if (result.data?.images) {
				images = result.data.images.objects;
			}
			if (result.error) {
				imagesError = result.error.message;
			}
		} catch (err) {
			imagesError = err instanceof Error ? err.message : 'Failed to load images';
		} finally {
			imagesLoading = false;
		}
	}

	function openAddImageModal() {
		showAddImageModal = true;
		imageUrl = '';
		addImageError = null;
	}

	function closeAddImageModal() {
		showAddImageModal = false;
		imageUrl = '';
		addImageError = null;
	}

	async function handleAddImage() {
		if (!imageUrl.trim()) {
			addImageError = 'Image URL is required';
			return;
		}

		try {
			addImageLoading = true;
			addImageError = null;

			const result = await client
				.mutation(CREATE_IMAGE, {
					url: imageUrl.trim()
				})
				.toPromise();

			if (result.error) {
				addImageError = result.error.message;
				return;
			}

			if (result.data?.createImage) {
				// Add the new image to the list
				images = [...images, result.data.createImage];
				closeAddImageModal();
			}
		} catch (err) {
			addImageError = err instanceof Error ? err.message : 'Failed to add image';
		} finally {
			addImageLoading = false;
		}
	}

	function openDeleteImageModal(image: Image) {
		imageToDelete = image;
		showDeleteImageModal = true;
		deleteImageError = null;
	}

	function closeDeleteImageModal() {
		showDeleteImageModal = false;
		imageToDelete = null;
		deleteImageError = null;
	}

	async function handleDeleteImage() {
		if (!imageToDelete) return;

		try {
			deleteImageLoading = true;
			deleteImageError = null;

			const result = await client
				.mutation(DELETE_IMAGE, {
					id: imageToDelete.id
				})
				.toPromise();

			if (result.error) {
				deleteImageError = result.error.message;
				return;
			}

			if (result.data?.deleteImage) {
				// Remove the image from the list
				images = images.filter((img) => img.id !== imageToDelete?.id);
				closeDeleteImageModal();
			}
		} catch (err) {
			deleteImageError = err instanceof Error ? err.message : 'Failed to delete image';
		} finally {
			deleteImageLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{project?.name || 'Project'} - SATIn</title>
	<meta name="description" content="Manage images for project" />
</svelte:head>

<Navigation />

<div class="project-detail-page">
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading project...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
				<path
					d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16ZM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646Z"
				/>
			</svg>
			<h2>Error Loading Project</h2>
			<p>{error}</p>
			<a href="/projects" class="back-button">Back to Projects</a>
		</div>
	{:else if project}
		<header class="page-header">
			<div class="header-content">
				<a href="/projects" class="back-link">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
						/>
					</svg>
					Back to Projects
				</a>
				<div class="project-info">
					<h1>{project.name}</h1>
					<p class="project-description">{project.description}</p>
				</div>
			</div>
		</header>

		<main class="project-content">
			<section class="images-section">
				<div class="section-header">
					<h2>Images</h2>
					<button class="add-image-button" onclick={openAddImageModal}>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<path
								d="M8 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 1.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM8 5a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 8 5Z"
							/>
						</svg>
						Add Image
					</button>
				</div>

				{#if imagesLoading}
					<div class="loading-state">
						<div class="spinner"></div>
						<p>Loading images...</p>
					</div>
				{:else if imagesError}
					<div class="error-state">
						<p>{imagesError}</p>
						<button onclick={loadImages}>Try Again</button>
					</div>
				{:else if images.length === 0}
					<div class="empty-state">
						<svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor">
							<path
								d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"
							/>
						</svg>
						<h3>No Images Yet</h3>
						<p>Add your first image to get started with annotations.</p>
						<button class="primary-button" onclick={openAddImageModal}>Add First Image</button>
					</div>
				{:else}
					<div class="images-grid">
						{#each images as image (image.id)}
							<div class="image-card">
								<div class="image-container">
									<img src={image.url} alt="Project image" loading="lazy" />
									<div class="image-overlay">
										<button
											class="delete-image-button"
											onclick={() => openDeleteImageModal(image)}
											aria-label="Delete image"
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
								<div class="image-info">
									<p class="image-url">{image.url}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</main>
	{/if}
</div>

<!-- Add Image Modal -->
{#if showAddImageModal}
	<div class="modal-overlay" onclick={closeAddImageModal}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Add Image</h2>
				<button class="close-button" onclick={closeAddImageModal} aria-label="Close modal">
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
					handleAddImage();
				}}
			>
				<div class="form-group">
					<label for="image-url">Image URL</label>
					<input
						id="image-url"
						type="url"
						bind:value={imageUrl}
						placeholder="https://example.com/image.jpg"
						required
						disabled={addImageLoading}
					/>
					<p class="form-help">Enter a valid URL to an image file (JPG, PNG, GIF, etc.)</p>
				</div>

				{#if addImageError}
					<div class="error-message">
						{addImageError}
					</div>
				{/if}

				<div class="modal-actions">
					<button
						type="button"
						class="cancel-button"
						onclick={closeAddImageModal}
						disabled={addImageLoading}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="submit-button"
						disabled={addImageLoading || !imageUrl.trim()}
					>
						{#if addImageLoading}
							<div class="button-spinner"></div>
							Adding...
						{:else}
							Add Image
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Image Confirmation Modal -->
{#if showDeleteImageModal && imageToDelete}
	<div class="modal-overlay" onclick={closeDeleteImageModal}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Delete Image</h2>
				<button class="close-button" onclick={closeDeleteImageModal} aria-label="Close modal">
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
				<h3>Are you sure you want to delete this image?</h3>
				<div class="image-preview">
					<img src={imageToDelete.url} alt="Image to delete" />
				</div>
				<p>
					This action cannot be undone. The image and any associated annotations will be permanently
					removed.
				</p>

				{#if deleteImageError}
					<div class="error-message">
						{deleteImageError}
					</div>
				{/if}

				<div class="modal-actions">
					<button
						type="button"
						class="cancel-button"
						onclick={closeDeleteImageModal}
						disabled={deleteImageLoading}
					>
						Cancel
					</button>
					<button
						type="button"
						class="delete-confirm-button"
						onclick={handleDeleteImage}
						disabled={deleteImageLoading}
					>
						{#if deleteImageLoading}
							<div class="button-spinner"></div>
							Deleting...
						{:else}
							Delete Image
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.project-detail-page {
		min-height: 100vh;
		background-color: #f8fafc;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 50vh;
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

	.error-state svg {
		margin-bottom: 1rem;
		color: #ef4444;
	}

	.error-state h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.back-button {
		padding: 0.75rem 1.5rem;
		background-color: #3b82f6;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.back-button:hover {
		background-color: #2563eb;
	}

	.page-header {
		background: white;
		border-bottom: 1px solid #e2e8f0;
		padding: 2rem;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #64748b;
		text-decoration: none;
		font-weight: 500;
		margin-bottom: 1rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #3b82f6;
	}

	.project-info h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.project-description {
		color: #64748b;
		font-size: 1.125rem;
		margin: 0;
	}

	.project-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.section-header h2 {
		font-size: 1.875rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.add-image-button {
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

	.add-image-button:hover {
		background-color: #2563eb;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		text-align: center;
		color: #64748b;
	}

	.empty-state svg {
		margin-bottom: 1rem;
		color: #94a3b8;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

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

	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.image-card {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		transition: all 0.2s;
	}

	.image-card:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
	}

	.image-container {
		position: relative;
		aspect-ratio: 4/3;
		overflow: hidden;
	}

	.image-container img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.2s;
	}

	.image-container:hover img {
		transform: scale(1.05);
	}

	.image-overlay {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.image-container:hover .image-overlay {
		opacity: 1;
	}

	.delete-image-button {
		background: rgba(239, 68, 68, 0.9);
		color: white;
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
	}

	.delete-image-button:hover {
		background: rgba(239, 68, 68, 1);
		transform: scale(1.1);
	}

	.image-info {
		padding: 1rem;
	}

	.image-url {
		color: #64748b;
		font-size: 0.875rem;
		margin: 0;
		word-break: break-all;
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

	.form-group input {
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

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group input:disabled {
		background-color: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}

	.form-help {
		color: #6b7280;
		font-size: 0.75rem;
		margin: 0.25rem 0 0 0;
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
	.submit-button,
	.delete-confirm-button {
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

	.delete-confirm-button {
		background-color: #dc2626;
		color: white;
		border-color: #dc2626;
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

	.image-preview {
		margin: 1rem 0;
		border-radius: 8px;
		overflow: hidden;
		max-width: 200px;
		margin-left: auto;
		margin-right: auto;
	}

	.image-preview img {
		width: 100%;
		height: auto;
		display: block;
	}

	@media (max-width: 768px) {
		.project-detail-page {
			padding: 0;
		}

		.page-header {
			padding: 1rem;
		}

		.project-info h1 {
			font-size: 2rem;
		}

		.project-content {
			padding: 1rem;
		}

		.section-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.images-grid {
			grid-template-columns: 1fr;
		}

		.modal-content {
			margin: 1rem;
			max-width: none;
		}

		.modal-actions {
			flex-direction: column-reverse;
		}

		.cancel-button,
		.submit-button,
		.delete-confirm-button {
			justify-content: center;
		}
	}
</style>
