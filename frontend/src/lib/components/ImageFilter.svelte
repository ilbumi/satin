<script lang="ts">
	interface Props {
		searchQuery: string;
		selectedStatuses: string[];
		sortBy: string;
		sortOrder: 'asc' | 'desc';
		onSearchChange: (query: string) => void;
		onStatusChange: (statuses: string[]) => void;
		onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
		onClearFilters: () => void;
	}

	let {
		searchQuery,
		selectedStatuses,
		sortBy,
		sortOrder,
		onSearchChange,
		onStatusChange,
		onSortChange,
		onClearFilters
	}: Props = $props();

	function handleStatusFilter(status: string) {
		if (selectedStatuses.includes(status)) {
			onStatusChange(selectedStatuses.filter((s) => s !== status));
		} else {
			onStatusChange([...selectedStatuses, status]);
		}
	}

	function handleSortByChange(newSortBy: string) {
		onSortChange(newSortBy, sortOrder);
	}

	function handleSortOrderChange(newSortOrder: 'asc' | 'desc') {
		onSortChange(sortBy, newSortOrder);
	}

	const statusOptions = [
		{ value: 'new', label: 'New', icon: '🆕' },
		{ value: 'annotated', label: 'Annotated', icon: '✅' },
		{ value: 'needs_reannotation', label: 'Needs Re-annotation', icon: '⚠️' }
	];
</script>

<div class="rounded-lg bg-white p-6 shadow">
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
		<!-- Search -->
		<div>
			<label for="search" class="mb-2 block text-sm font-medium text-gray-700">
				Search Images
			</label>
			<div class="relative">
				<input
					id="search"
					type="text"
					value={searchQuery}
					oninput={(e) => {
						const target = e.target as HTMLInputElement;
						onSearchChange(target.value);
					}}
					placeholder="Search by URL or filename..."
					class="block w-full rounded-md border-gray-300 py-2 pr-3 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				/>
				<svg
					class="absolute top-2.5 left-3 h-4 w-4 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
		</div>

		<!-- Status Filter -->
		<div>
			<fieldset>
				<legend class="mb-2 block text-sm font-medium text-gray-700">Filter by Status</legend>
				<div class="space-y-2">
					{#each statusOptions as status (status.value)}
						<label class="flex items-center">
							<input
								type="checkbox"
								checked={selectedStatuses.includes(status.value)}
								onchange={() => handleStatusFilter(status.value)}
								class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<span class="flex items-center text-sm text-gray-700">
								<span class="mr-1" aria-hidden="true">{status.icon}</span>
								{status.label}
							</span>
						</label>
					{/each}
				</div>
			</fieldset>
		</div>

		<!-- Sort Options -->
		<div>
			<label for="sort-by" class="mb-2 block text-sm font-medium text-gray-700"> Sort By </label>
			<select
				id="sort-by"
				value={sortBy}
				onchange={(e) => {
					const target = e.target as HTMLSelectElement;
					handleSortByChange(target.value);
				}}
				class="block w-full rounded-md border-gray-300 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
			>
				<option value="created_at">Date Added</option>
				<option value="status">Status</option>
				<option value="url">URL</option>
				<option value="width">Width</option>
				<option value="height">Height</option>
			</select>
		</div>

		<!-- Sort Order & Actions -->
		<div>
			<label for="sort-order" class="mb-2 block text-sm font-medium text-gray-700">
				Sort Order
			</label>
			<div class="space-y-2">
				<select
					id="sort-order"
					value={sortOrder}
					onchange={(e) => {
						const target = e.target as HTMLSelectElement;
						handleSortOrderChange(target.value as 'asc' | 'desc');
					}}
					class="block w-full rounded-md border-gray-300 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
				>
					<option value="desc">Newest First</option>
					<option value="asc">Oldest First</option>
				</select>
				<button
					onclick={onClearFilters}
					class="w-full text-sm text-blue-600 underline hover:text-blue-800"
				>
					Clear All Filters
				</button>
			</div>
		</div>
	</div>

	<!-- Active Filters Summary -->
	{#if searchQuery || selectedStatuses.length < statusOptions.length}
		<div class="mt-4 border-t border-gray-200 pt-4">
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-sm text-gray-600">Active filters:</span>

				{#if searchQuery}
					<span
						class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
					>
						Search: "{searchQuery}"
						<button
							onclick={() => onSearchChange('')}
							class="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200"
						>
							×
						</button>
					</span>
				{/if}

				{#if selectedStatuses.length < statusOptions.length}
					<span
						class="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800"
					>
						Status: {selectedStatuses.length} of {statusOptions.length}
						<button
							onclick={() => onStatusChange(statusOptions.map((s) => s.value))}
							class="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-orange-600 hover:bg-orange-200"
						>
							×
						</button>
					</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
