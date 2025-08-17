<script lang="ts">
	import { Modal, Button, Input } from '$lib/components/ui';
	import {
		createProjectSchema,
		type CreateProjectFormData
	} from '$lib/features/projects/validation';
	import type { CreateProjectForm } from '$lib/features/projects/types';

	interface Props {
		open: boolean;
		loading?: boolean;
		onClose: () => void;
		onSubmit: (data: CreateProjectForm) => Promise<void>;
	}

	let { open, loading = false, onClose, onSubmit }: Props = $props();

	let formData = $state<CreateProjectFormData>({
		name: '',
		description: ''
	});

	let errors = $state<Partial<Record<keyof CreateProjectFormData, string>>>({});
	let submitError = $state<string | null>(null);

	// Check if form is valid
	const isFormValid = $derived.by(() => {
		return createProjectSchema.safeParse(formData).success;
	});

	function resetForm() {
		formData = {
			name: '',
			description: ''
		};
		errors = {};
		submitError = null;
	}

	function validateField(field: keyof CreateProjectFormData, value: string) {
		try {
			createProjectSchema.shape[field].parse(value);
			errors[field] = undefined;
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

	function handleNameBlur(event: Event) {
		const target = event.target as HTMLInputElement;
		validateField('name', target.value);
	}

	function handleDescriptionChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		formData.description = target.value;
		validateField('description', target.value);
	}

	function handleDescriptionBlur(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		validateField('description', target.value);
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		submitError = null;

		try {
			const validatedData = createProjectSchema.parse(formData);
			await onSubmit(validatedData);
			resetForm();
			onClose();
		} catch (error) {
			if (error instanceof Error) {
				try {
					const zodErrors = JSON.parse(error.message);
					errors = {};
					zodErrors.forEach((err: { path?: string[]; message: string }) => {
						if (err.path && err.path[0]) {
							errors[err.path[0] as keyof CreateProjectFormData] = err.message;
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
		resetForm();
		onClose();
	}

	$effect(() => {
		if (open) {
			resetForm();
		}
	});
</script>

<Modal {open} onClose={handleClose} size="md" data-testid="create-project-modal">
	{#snippet header()}
		<h2 class="text-xl font-semibold text-gray-900">Create New Project</h2>
	{/snippet}

	<form onsubmit={handleSubmit} class="space-y-6">
		{#if submitError}
			<div class="rounded-md bg-red-50 p-4">
				<div class="text-sm text-red-700">{submitError}</div>
			</div>
		{/if}

		<div>
			<label for="project-name" class="mb-2 block text-sm font-medium text-gray-700">
				Project Name
				<span class="text-red-500">*</span>
			</label>
			<Input
				id="project-name"
				type="text"
				value={formData.name}
				oninput={handleNameChange}
				onblur={handleNameBlur}
				placeholder="Enter project name"
				required
				error={errors.name}
				disabled={loading}
			/>
		</div>

		<div>
			<label for="project-description" class="mb-2 block text-sm font-medium text-gray-700">
				Description
				<span class="text-red-500">*</span>
			</label>
			<textarea
				id="project-description"
				rows="4"
				value={formData.description}
				oninput={handleDescriptionChange}
				onblur={handleDescriptionBlur}
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
	</form>

	{#snippet footer()}
		<div class="flex items-center justify-end space-x-3">
			<Button variant="secondary" onclick={handleClose} disabled={loading}>Cancel</Button>
			<Button
				type="submit"
				variant="primary"
				onclick={handleSubmit}
				{loading}
				disabled={loading || !isFormValid}
			>
				Create Project
			</Button>
		</div>
	{/snippet}
</Modal>
