<script lang="ts">
	import { Modal, Button, Select } from '$lib/components/ui';
	import type { CreateTaskForm } from '$lib/features/tasks/types';
	import type { TaskStatus } from '$lib/graphql/generated/graphql';
	import { validateCreateTask } from '$lib/features/tasks/validation';

	interface Props {
		open: boolean;
		onClose: () => void;
		onSubmit: (data: CreateTaskForm) => Promise<void>;
		projects?: Array<{ id: string; name: string }>;
		images?: Array<{ id: string; url: string; name?: string }>;
	}

	let { open, onClose, onSubmit, projects = [], images = [] }: Props = $props();

	// Form state
	let formData: CreateTaskForm = $state({
		imageId: '',
		projectId: '',
		bboxes: [],
		status: 'DRAFT'
	});

	let errors: Record<string, string> = $state({});
	let submitting = $state(false);

	// Reset form when modal opens
	$effect(() => {
		if (open) {
			resetForm();
		}
	});

	function resetForm() {
		formData = {
			imageId: '',
			projectId: '',
			bboxes: [],
			status: 'DRAFT'
		};
		errors = {};
	}

	function validateField(field: keyof CreateTaskForm, value: unknown) {
		// Only validate required fields
		if (field === 'imageId' && (!value || value === '')) {
			errors[field] = 'Image is required';
			return;
		}

		if (field === 'projectId' && (!value || value === '')) {
			errors[field] = 'Project is required';
			return;
		}

		// Clear errors if field is valid
		errors[field] = '';
	}

	function isFormValid(): boolean {
		return (
			formData.imageId !== '' &&
			formData.projectId !== '' &&
			Object.values(errors).every((error) => error === '')
		);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting) return;

		try {
			// Validate entire form
			validateCreateTask(formData);

			submitting = true;
			await onSubmit(formData);
			onClose();
		} catch (error) {
			console.error('Failed to create task:', error);
			if (error instanceof Error) {
				errors.general = error.message;
			}
		} finally {
			submitting = false;
		}
	}

	function handleClose() {
		if (!submitting) {
			onClose();
		}
	}

	// Get selected image name for display
	let imageName = $derived(() => {
		const selectedImage = images.find((img) => img.id === formData.imageId);
		return selectedImage?.name || selectedImage?.url.split('/').pop() || 'Unknown';
	});

	// Get selected project name for display
	let projectName = $derived(() => {
		const selectedProject = projects.find((proj) => proj.id === formData.projectId);
		return selectedProject?.name || 'Unknown';
	});

	// Status options
	const statusOptions = [
		{ value: 'DRAFT', label: 'Draft' },
		{ value: 'FINISHED', label: 'Finished' },
		{ value: 'REVIEWED', label: 'Reviewed' }
	];
</script>

<Modal {open} onClose={handleClose} title="Create New Task" size="lg">
	<form onsubmit={handleSubmit} class="space-y-6">
		<!-- General Error -->
		{#if errors.general}
			<div class="rounded-md bg-red-50 p-4">
				<div class="text-sm text-red-700">{errors.general}</div>
			</div>
		{/if}

		<!-- Project Selection -->
		<div>
			<label for="project" class="block text-sm font-medium text-gray-700">
				Project <span class="text-red-500">*</span>
			</label>
			<Select
				id="project"
				bind:value={formData.projectId}
				onchange={(event) => {
					const value = (event.currentTarget as HTMLSelectElement).value;
					formData.projectId = value;
					validateField('projectId', value);
				}}
				error={errors.projectId}
				disabled={submitting}
				class="mt-1"
				data-testid="project-select"
			>
				<option value="">Select a project...</option>
				{#each projects as project (project.id)}
					<option value={project.id}>{project.name}</option>
				{/each}
			</Select>
			{#if errors.projectId}
				<p class="mt-1 text-sm text-red-600">{errors.projectId}</p>
			{/if}
		</div>

		<!-- Image Selection -->
		<div>
			<label for="image" class="block text-sm font-medium text-gray-700">
				Image <span class="text-red-500">*</span>
			</label>
			<Select
				id="image"
				bind:value={formData.imageId}
				onchange={(event) => {
					const value = (event.currentTarget as HTMLSelectElement).value;
					formData.imageId = value;
					validateField('imageId', value);
				}}
				error={errors.imageId}
				disabled={submitting}
				class="mt-1"
				data-testid="image-select"
			>
				<option value="">Select an image...</option>
				{#each images as image (image.id)}
					<option value={image.id}>
						{image.name || image.url.split('/').pop() || 'Unknown Image'}
					</option>
				{/each}
			</Select>
			{#if errors.imageId}
				<p class="mt-1 text-sm text-red-600">{errors.imageId}</p>
			{/if}
		</div>

		<!-- Status Selection -->
		<div>
			<label for="status" class="block text-sm font-medium text-gray-700"> Initial Status </label>
			<Select
				id="status"
				bind:value={formData.status}
				onchange={(event) => {
					const value = (event.currentTarget as HTMLSelectElement).value as TaskStatus;
					formData.status = value;
					validateField('status', value);
				}}
				disabled={submitting}
				class="mt-1"
				data-testid="status-select"
			>
				{#each statusOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>
		</div>

		<!-- Task Preview -->
		{#if formData.projectId && formData.imageId}
			<div class="rounded-md bg-gray-50 p-4">
				<h4 class="mb-2 text-sm font-medium text-gray-900">Task Preview</h4>
				<div class="space-y-1 text-sm text-gray-600">
					<p><strong>Project:</strong> {projectName}</p>
					<p><strong>Image:</strong> {imageName}</p>
					<p>
						<strong>Status:</strong>
						{statusOptions.find((opt) => opt.value === formData.status)?.label}
					</p>
				</div>
			</div>
		{/if}

		<!-- Form Actions -->
		<div class="flex items-center justify-end space-x-3 border-t pt-6">
			<Button
				type="button"
				variant="secondary"
				onclick={handleClose}
				disabled={submitting}
				data-testid="cancel-button"
			>
				Cancel
			</Button>
			<Button
				type="submit"
				variant="primary"
				disabled={!isFormValid() || submitting}
				data-testid="create-button"
			>
				{#if submitting}
					<div
						class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"
					></div>
					Creating...
				{:else}
					Create Task
				{/if}
			</Button>
		</div>
	</form>
</Modal>
