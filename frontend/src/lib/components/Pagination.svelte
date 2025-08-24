<script lang="ts">
	interface Props {
		currentPage: number;
		totalItems: number;
		itemsPerPage: number;
		onPageChange: (page: number) => void;
		onItemsPerPageChange: (itemsPerPage: number) => void;
	}

	let { currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }: Props =
		$props();

	let totalPages = $derived(Math.ceil(totalItems / itemsPerPage));
	let startItem = $derived((currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	let visiblePages = $derived(() => {
		const pages: number[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			const start = Math.max(1, currentPage - 2);
			const end = Math.min(totalPages, currentPage + 2);

			if (start > 1) {
				pages.push(1);
				if (start > 2) {
					pages.push(-1); // Ellipsis indicator
				}
			}

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (end < totalPages) {
				if (end < totalPages - 1) {
					pages.push(-1); // Ellipsis indicator
				}
				pages.push(totalPages);
			}
		}

		return pages;
	});

	function handlePageChange(page: number) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			onPageChange(page);
		}
	}

	function handleItemsPerPageChange(newItemsPerPage: number) {
		onItemsPerPageChange(newItemsPerPage);
	}

	function handleKeydown(event: KeyboardEvent, page: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handlePageChange(page);
		}
	}

	const itemsPerPageOptions = [12, 24, 48, 96];
</script>

{#if totalPages > 1}
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
		<!-- Items per page selector -->
		<div class="flex items-center space-x-2 text-sm text-gray-700">
			<span>Items per page:</span>
			<select
				value={itemsPerPage}
				onchange={(e) => {
					const target = e.target as HTMLSelectElement;
					handleItemsPerPageChange(Number(target.value));
				}}
				class="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
				aria-label="Select items per page"
			>
				{#each itemsPerPageOptions as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>

		<!-- Pagination info and controls -->
		<div class="flex flex-col items-center space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
			<!-- Results info -->
			<div class="text-sm text-gray-700">
				Showing {startItem} to {endItem} of {totalItems} results
			</div>

			<!-- Pagination controls -->
			<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
				<!-- Previous button -->
				<button
					onclick={() => handlePageChange(currentPage - 1)}
					disabled={currentPage <= 1}
					class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
					aria-label="Go to previous page"
				>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<!-- Page numbers -->
				{#each visiblePages() as page (page)}
					{#if page === -1}
						<!-- Ellipsis -->
						<span
							class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 ring-inset focus:outline-offset-0"
						>
							...
						</span>
					{:else}
						<button
							onclick={() => handlePageChange(page as number)}
							onkeydown={(e) => handleKeydown(e, page as number)}
							class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 {currentPage ===
							page
								? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
								: 'text-gray-900'}"
							aria-label="Go to page {page}"
							aria-current={currentPage === page ? 'page' : undefined}
						>
							{page}
						</button>
					{/if}
				{/each}

				<!-- Next button -->
				<button
					onclick={() => handlePageChange(currentPage + 1)}
					disabled={currentPage >= totalPages}
					class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
					aria-label="Go to next page"
				>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</nav>
		</div>
	</div>
{/if}
