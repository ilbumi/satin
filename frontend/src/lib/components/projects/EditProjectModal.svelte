<script lang="ts">
	import { Modal, Button, Input } from '$lib/components/ui';
	import {
		updateProjectSchema,
		type UpdateProjectFormData
	} from '$lib/features/projects/validation';
	import type { UpdateProjectForm, ProjectSummary } from '$lib/features/projects/types';

	interface Props {
		open: boolean;
		project: ProjectSummary | null;
		loading?: boolean;
		onClose: () => void;
		onSubmit: (data: UpdateProjectForm) => Promise<void>;
	}

	let { open, project, loading = false, onClose, onSubmit }: Props = $props();

	let formData = $state<UpdateProjectFormData>({
		id: '',
		name: '',
		description: ''
	});

	let errors = $state<Partial<Record<keyof UpdateProjectFormData, string>>>({});
	let submitError = $state<string | null>(null);

	function resetForm() {
		if (project) {
			formData = {
				id: project.id,
				name: project.name,
				description: project.description
			};
		} else {
			formData = {
				id: '',
				name: '',
				description: ''
			};
		}
		errors = {};
		submitError = null;
	}

	function validateField(field: keyof UpdateProjectFormData, value: string | undefined) {
		if (value === undefined) return;

		try {
			const fieldSchema = updateProjectSchema.shape[field];
			if (fieldSchema) {
				fieldSchema.parse(value);
				errors[field] = undefined;
			}
		} catch (error) {
			if (error instanceof Error) {
				const zodError = JSON.parse(error.message);
				errors[field] = zodError[0]?.message || 'Invalid value';
			}
		}
	}

	function handleNameChange(event: Event) {
		const target = event.target as HTMLInputElement;
		formData.name = target.value;
		validateField('name', target.value);
	}

	function handleDescriptionChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		formData.description = target.value;
		validateField('description', target.value);
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		submitError = null;

		try {
			const validatedData = updateProjectSchema.parse(formData);
			await onSubmit(validatedData);
			onClose();
		} catch (error) {
			if (error instanceof Error) {
				try {
					const zodErrors = JSON.parse(error.message);
					errors = {};
					zodErrors.forEach((err: { path?: string[]; message: string }) => {
						if (err.path && err.path[0]) {
							errors[err.path[0] as keyof UpdateProjectFormData] = err.message;
						}
					});
				} catch {
					submitError = error.message;
				}
			} else {
				submitError = 'An unexpected error occurred';
			}
		}
	}

	function handleClose() {
		onClose();
	}

	$effect(() => {
		if (open && project) {
			resetForm();
		}
	});
</script>

<Modal {open} onClose={handleClose} size="md">
	{#snippet header()}
		<h2 class="text-xl font-semibold text-gray-900">Edit Project</h2>
	{/snippet}

	{#if project}
		<form onsubmit={handleSubmit} class="space-y-6">
			{#if submitError}
				<div class="rounded-md bg-red-50 p-4">
					<div class="text-sm text-red-700">{submitError}</div>
				</div>
			{/if}

			<div>
				<label for="edit-project-name" class="mb-2 block text-sm font-medium text-gray-700">
					Project Name
					<span class="text-red-500">*</span>
				</label>
				<Input
					id="edit-project-name"
					type="text"
					value={formData.name}
					oninput={handleNameChange}
					placeholder="Enter project name"
					required
					error={errors.name}
					disabled={loading}
				/>
			</div>

			<div>
				<label for="edit-project-description" class="mb-2 block text-sm font-medium text-gray-700">
					Description
					<span class="text-red-500">*</span>
				</label>
				<textarea
					id="edit-project-description"
					rows="4"
					value={formData.description}
					oninput={handleDescriptionChange}
					placeholder="Describe your annotation project"
					required
					disabled={loading}
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 {errors.description
						? 'border-red-500 focus:border-red-500 focus:ring-red-500'
						: ''}"
				></textarea>
				{#if errors.description}
					<p class="mt-1 text-sm text-red-600">{errors.description}</p>
				{/if}
			</div>

			<div class="rounded-md bg-gray-50 p-4">
				<div class="text-sm text-gray-600">
					<strong>Project ID:</strong>
					<span class="font-mono">{project.id}</span>
				</div>
			</div>
		</form>
	{/if}

	{#snippet footer()}
		<div class="flex items-center justify-end space-x-3">
			<Button variant="secondary" onclick={handleClose} disabled={loading}>Cancel</Button>
			{#if project}
				<Button
					type="submit"
					variant="primary"
					onclick={handleSubmit}
					{loading}
					disabled={loading || !formData.name || !formData.description}
				>
					Update Project
				</Button>
			{/if}
		</div>
	{/snippet}
</Modal>
