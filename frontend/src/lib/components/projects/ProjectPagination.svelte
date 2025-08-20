<script lang="ts">
	import { Button } from '$lib/components/ui';

	interface Props {
		limit: number;
		offset: number;
		totalCount: number;
		hasMore: boolean;
		loading?: boolean;
		onNext: () => void;
		onPrev: () => void;
	}

	let { limit, offset, totalCount, hasMore, loading = false, onNext, onPrev }: Props = $props();

	const currentPage = $derived(Math.floor(offset / limit) + 1);
	const totalPages = $derived(Math.ceil(totalCount / limit));
	const startItem = $derived(offset + 1);
	const endItem = $derived(Math.min(offset + limit, totalCount));

	const canGoPrev = $derived(offset > 0);
	const canGoNext = $derived(hasMore);
</script>

{#if totalCount > 0}
	<div
		class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
	>
		<div class="flex flex-1 justify-between sm:hidden">
			<Button variant="secondary" onclick={onPrev} disabled={!canGoPrev || loading} size="sm">
				Previous
			</Button>
			<Button variant="secondary" onclick={onNext} disabled={!canGoNext || loading} size="sm">
				Next
			</Button>
		</div>

		<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
			<div>
				<p class="text-sm text-gray-700">
					Showing
					<span class="font-medium">{startItem}</span>
					to
					<span class="font-medium">{endItem}</span>
					of
					<span class="font-medium">{totalCount}</span>
					projects
				</p>
			</div>

			<div class="flex items-center space-x-2">
				<span class="text-sm text-gray-700">
					Page {currentPage} of {totalPages}
				</span>

				<div class="flex space-x-1">
					<Button variant="secondary" onclick={onPrev} disabled={!canGoPrev || loading} size="sm">
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
						Previous
					</Button>

					<Button variant="secondary" onclick={onNext} disabled={!canGoNext || loading} size="sm">
						Next
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
