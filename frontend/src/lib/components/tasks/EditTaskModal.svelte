<script lang="ts">
	import { Modal, Button, Select } from '$lib/components/ui';
	import type { UpdateTaskForm, TaskSummary } from '$lib/features/tasks/types';
	import type { TaskStatus } from '$lib/graphql/generated/graphql';
	import { validateUpdateTask } from '$lib/features/tasks/validation';

	interface Props {
		open: boolean;
		task: TaskSummary | null;
		onClose: () => void;
		onSubmit: (data: UpdateTaskForm) => Promise<void>;
		projects?: Array<{ id: string; name: string }>;
		images?: Array<{ id: string; url: string; name?: string }>;
	}

	let { open, task, onClose, onSubmit, projects = [], images = [] }: Props = $props();

	// Form state
	let formData: UpdateTaskForm = $state({
		id: '',
		imageId: undefined,
		projectId: undefined,
		bboxes: undefined,
		status: undefined
	});

	let errors: Record<string, string> = $state({});
	let submitting = $state(false);

	// Reset form when modal opens or task changes
	$effect(() => {
		if (open && task) {
			resetForm();
		}
	});

	function resetForm() {
		if (task) {
			formData = {
				id: task.id,
				imageId: task.imageId,
				projectId: task.projectId,
				bboxes: undefined, // Don't modify bboxes in basic edit
				status: task.status
			};
		}
		errors = {};
	}

	function validateField(field: keyof UpdateTaskForm, value: unknown) {
		try {
			const partialData = { [field]: value };
			validateUpdateTask({ ...formData, ...partialData });
			errors[field] = '';
		} catch (error) {
			if (error instanceof Error) {
				errors[field] = error.message;
			}
		}
	}

	function hasChanges(): boolean {
		if (!task) return false;

		return (
			formData.imageId !== task.imageId ||
			formData.projectId !== task.projectId ||
			formData.status !== task.status
		);
	}

	function isFormValid(): boolean {
		return (
			formData.id !== '' &&
			formData.imageId !== '' &&
			formData.projectId !== '' &&
			Object.values(errors).every((error) => error === '') &&
			hasChanges()
		);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (submitting || !task) return;

		try {
			// Only send changed fields
			const updateData: UpdateTaskForm = {
				id: formData.id
			};

			if (formData.imageId !== task.imageId) {
				updateData.imageId = formData.imageId;
			}
			if (formData.projectId !== task.projectId) {
				updateData.projectId = formData.projectId;
			}
			if (formData.status !== task.status) {
				updateData.status = formData.status;
			}

			// Validate the update data
			validateUpdateTask(updateData);

			submitting = true;
			await onSubmit(updateData);
			onClose();
		} catch (error) {
			console.error('Failed to update task:', error);
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

	// Get project name for display when showing changes
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

<Modal {open} onClose={handleClose} title="Edit Task" size="lg">
	{#if task}
		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- General Error -->
			{#if errors.general}
				<div class="rounded-md bg-red-50 p-4">
					<div class="text-sm text-red-700">{errors.general}</div>
				</div>
			{/if}

			<!-- Current Task Info -->
			<div class="rounded-md bg-blue-50 p-4">
				<h4 class="mb-2 text-sm font-medium text-blue-900">Current Task</h4>
				<div class="space-y-1 text-sm text-blue-800">
					<p><strong>ID:</strong> {task.id}</p>
					<p><strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
					<p><strong>Annotations:</strong> {task.bboxCount} bounding boxes</p>
				</div>
			</div>

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
				<label for="status" class="block text-sm font-medium text-gray-700"> Status </label>
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

			<!-- Changes Preview -->
			{#if hasChanges()}
				<div class="rounded-md bg-green-50 p-4">
					<h4 class="mb-2 text-sm font-medium text-green-900">Changes to Apply</h4>
					<div class="space-y-1 text-sm text-green-800">
						{#if formData.projectId !== task.projectId}
							<p><strong>Project:</strong> {task.projectName} → {projectName}</p>
						{/if}
						{#if formData.imageId !== task.imageId}
							<p><strong>Image:</strong> Changed</p>
						{/if}
						{#if formData.status !== task.status}
							<p><strong>Status:</strong> {task.status} → {formData.status}</p>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Warning about changing image/project -->
			{#if formData.imageId !== task.imageId || formData.projectId !== task.projectId}
				<div class="rounded-md bg-yellow-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg
								class="h-5 w-5 text-yellow-400"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-yellow-800">Warning</h3>
							<div class="mt-2 text-sm text-yellow-700">
								<p>
									Changing the image or project will affect the task's context. Existing annotations
									may no longer be valid.
								</p>
							</div>
						</div>
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
					data-testid="update-button"
				>
					{#if submitting}
						<div
							class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"
						></div>
						Updating...
					{:else}
						Update Task
					{/if}
				</Button>
			</div>
		</form>
	{:else}
		<div class="py-8 text-center text-gray-500">No task selected for editing.</div>
	{/if}
</Modal>
