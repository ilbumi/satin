<script lang="ts">
	import { annotationStore, selectedAnnotation } from '$lib/stores/annotation';
	import type { AnnotationWithLocal } from '$lib/stores/annotation';

	const annotations = $derived($annotationStore.annotations);
	const selected = $derived($selectedAnnotation);

	function selectAnnotation(id: string) {
		annotationStore.selectAnnotation(id);
	}

	function deleteAnnotation(id: string) {
		annotationStore.deleteAnnotation(id);
	}

	function formatCoordinates(ann: AnnotationWithLocal): string {
		return `(${Math.round(ann.x)}, ${Math.round(ann.y)}) ${Math.round(ann.width)}×${Math.round(ann.height)}`;
	}

	function getAnnotationLabel(ann: AnnotationWithLocal): string {
		if (ann.tags && ann.tags.length > 0) {
			return ann.tags.map((t) => t.name).join(', ');
		}
		return ann.description || 'Unlabeled';
	}
</script>

<div class="rounded-lg bg-white p-4 shadow-md">
	<div class="mb-3 flex items-center justify-between">
		<h3 class="text-sm font-semibold text-gray-700">
			Annotations ({annotations.length})
		</h3>

		{#if annotations.length > 0}
			<button
				onclick={() => annotationStore.clearAll()}
				class="text-xs text-red-600 hover:text-red-700"
			>
				Clear All
			</button>
		{/if}
	</div>

	{#if annotations.length === 0}
		<p class="py-4 text-center text-sm text-gray-500">
			No annotations yet. Draw a bounding box to start.
		</p>
	{:else}
		<div class="max-h-96 space-y-2 overflow-y-auto">
			{#each annotations as annotation (annotation.id)}
				<div
					class="cursor-pointer rounded-lg border p-2 transition-colors {annotation.id ===
					selected?.id
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-200 hover:border-gray-300'}"
					onclick={() => selectAnnotation(annotation.id)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							selectAnnotation(annotation.id);
						}
					}}
					role="button"
					tabindex="0"
				>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center space-x-2">
								<span class="text-sm font-medium text-gray-800">
									{getAnnotationLabel(annotation)}
								</span>

								{#if annotation.isDirty}
									<span class="rounded bg-yellow-100 px-1 py-0.5 text-xs text-yellow-700">
										unsaved
									</span>
								{/if}

								{#if annotation.source === 'ml'}
									<span class="rounded bg-green-100 px-1 py-0.5 text-xs text-green-700"> AI </span>
								{/if}
							</div>

							<div class="mt-1 text-xs text-gray-500">
								{formatCoordinates(annotation)}

								{#if annotation.confidence}
									• {Math.round(annotation.confidence * 100)}% confidence
								{/if}
							</div>
						</div>

						<button
							onclick={(e) => {
								e.stopPropagation();
								deleteAnnotation(annotation.id);
							}}
							class="ml-2 text-red-500 transition-colors hover:text-red-700"
							title="Delete annotation"
							aria-label="Delete annotation"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if $annotationStore.dirtyAnnotations.size > 0}
		<div class="mt-3 border-t border-gray-200 pt-3">
			<p class="text-xs text-yellow-600">
				{$annotationStore.dirtyAnnotations.size} unsaved change{$annotationStore.dirtyAnnotations
					.size === 1
					? ''
					: 's'}
			</p>
		</div>
	{/if}
</div>
