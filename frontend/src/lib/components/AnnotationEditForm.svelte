<script lang="ts">
	import { onMount } from 'svelte';
	import { getContextClient } from '@urql/svelte';
	import {
		UPDATE_ANNOTATION,
		type AnnotationUpdateInput,
		type AnnotationData
	} from '$lib/graphql/operations/annotations';
	import { handleMutationResult } from '$lib/utils/graphql-errors';

	interface Annotation {
		id: string;
		x: number;
		y: number;
		width: number;
		height: number;
		description?: string;
		tags: string[];
		confidence?: number;
		createdAt: string;
		updatedAt: string;
	}

	interface Props {
		annotation: Annotation;
		onSave?: (updatedAnnotation: Annotation) => void;
		onCancel?: () => void;
	}

	let { annotation, onSave, onCancel }: Props = $props();

	const client = getContextClient();

	let editedDescription = $state(annotation.description || '');
	let editedTags = $state(annotation.tags.join(', '));
	let editedConfidence = $state(annotation.confidence || undefined);
	let isSaving = $state(false);
	let error = $state<string | null>(null);
	let descriptionTextarea: HTMLTextAreaElement;
	let hasOptimisticUpdate = $state(false);

	let isFormDirty = $derived(
		editedDescription !== (annotation.description || '') ||
			editedTags !== annotation.tags.join(', ') ||
			editedConfidence !== annotation.confidence
	);

	async function handleSave() {
		if (isSaving || !isFormDirty) return;

		try {
			isSaving = true;
			hasOptimisticUpdate = true;
			error = null;

			// Create optimistic update immediately for UI responsiveness
			const optimisticAnnotation: Annotation = {
				...annotation,
				description: editedDescription.trim() || undefined,
				tags: editedTags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0),
				confidence: editedConfidence,
				updatedAt: new Date().toISOString()
			};

			// Apply optimistic update immediately
			onSave?.(optimisticAnnotation);

			const input: AnnotationUpdateInput = {
				description: editedDescription.trim() || undefined,
				tags: editedTags
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0),
				confidence: editedConfidence
			};

			const result = await client
				.mutation(UPDATE_ANNOTATION, {
					id: annotation.id,
					input
				})
				.toPromise();

			const mutationResult = handleMutationResult<AnnotationData>(result, 'updateAnnotation');

			if (mutationResult.success && mutationResult.data) {
				// Apply the real backend data (overwrites optimistic update)
				const updatedAnnotation: Annotation = {
					...annotation,
					description: mutationResult.data.description,
					tags: mutationResult.data.tags,
					confidence: mutationResult.data.confidence ?? undefined,
					updatedAt: mutationResult.data.updatedAt
				};
				onSave?.(updatedAnnotation);
				hasOptimisticUpdate = false;
			} else {
				throw new Error(mutationResult.error || 'Failed to update annotation');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save annotation';
			hasOptimisticUpdate = false;
			// Revert optimistic update on error by re-applying original data
			onSave?.(annotation);
		} finally {
			isSaving = false;
		}
	}

	function handleCancel() {
		editedDescription = annotation.description || '';
		editedTags = annotation.tags.join(', ');
		editedConfidence = annotation.confidence || undefined;
		error = null;
		onCancel?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			event.preventDefault();
			handleSave();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			handleCancel();
		}
	}

	function validateConfidence(value: string): number | undefined {
		if (!value.trim()) return undefined;
		const num = parseFloat(value);
		if (isNaN(num)) return undefined;
		return Math.max(0, Math.min(1, num));
	}

	// Auto-focus the description textarea when component mounts
	onMount(() => {
		if (descriptionTextarea) {
			descriptionTextarea.focus();
			// Move cursor to end of text
			descriptionTextarea.setSelectionRange(
				descriptionTextarea.value.length,
				descriptionTextarea.value.length
			);
		}
	});
</script>

<div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
	<h4 class="mb-3 text-sm font-medium text-gray-700">Edit Annotation</h4>

	{#if error}
		<div class="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">
			{error}
		</div>
	{:else if hasOptimisticUpdate}
		<div class="mb-3 flex items-center rounded bg-blue-100 p-2 text-sm text-blue-700">
			<div
				class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
			></div>
			Saving changes...
		</div>
	{/if}

	<div class="space-y-3">
		<!-- Description -->
		<div>
			<label for="description" class="mb-1 block text-xs font-medium text-gray-600">
				Description
			</label>
			<textarea
				id="description"
				bind:this={descriptionTextarea}
				bind:value={editedDescription}
				onkeydown={handleKeydown}
				placeholder="Describe what you see..."
				class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
				rows="2"
			></textarea>
		</div>

		<!-- Tags -->
		<div>
			<label for="tags" class="mb-1 block text-xs font-medium text-gray-600">
				Tags (comma-separated)
			</label>
			<input
				id="tags"
				type="text"
				bind:value={editedTags}
				onkeydown={handleKeydown}
				placeholder="person, car, building..."
				class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<!-- Confidence -->
		<div>
			<label for="confidence" class="mb-1 block text-xs font-medium text-gray-600">
				Confidence (0.0 - 1.0)
			</label>
			<input
				id="confidence"
				type="number"
				min="0"
				max="1"
				step="0.1"
				bind:value={editedConfidence}
				oninput={(e) => {
					const value = (e.target as HTMLInputElement).value;
					editedConfidence = validateConfidence(value);
				}}
				onkeydown={handleKeydown}
				placeholder="0.8"
				class="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-2 pt-2">
			<button
				onclick={handleSave}
				disabled={isSaving || !isFormDirty}
				class="flex-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isSaving ? 'Saving...' : 'Save'}
			</button>
			<button
				onclick={handleCancel}
				disabled={isSaving}
				class="flex-1 rounded bg-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Cancel
			</button>
		</div>
	</div>

	<!-- Keyboard Shortcuts Help -->
	<div class="mt-3 text-xs text-gray-500">Press Ctrl+Enter to save, Esc to cancel</div>
</div>
