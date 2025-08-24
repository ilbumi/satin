<script lang="ts">
	import { toasts, removeToast } from '$lib/stores/toast';
	import { fly } from 'svelte/transition';

	const iconMap = {
		success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
		warning:
			'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};

	const colorMap = {
		success: 'bg-green-50 border-green-200 text-green-800',
		error: 'bg-red-50 border-red-200 text-red-800',
		warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
		info: 'bg-blue-50 border-blue-200 text-blue-800'
	};

	const iconColorMap = {
		success: 'text-green-400',
		error: 'text-red-400',
		warning: 'text-yellow-400',
		info: 'text-blue-400'
	};
</script>

<div class="fixed top-4 right-4 z-50 space-y-2">
	{#each $toasts as toast (toast.id)}
		<div
			transition:fly={{ x: 300, duration: 300 }}
			class="max-w-sm rounded-lg border p-4 shadow-lg {colorMap[toast.type]}"
		>
			<div class="flex">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 {iconColorMap[toast.type]}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={iconMap[toast.type]}
						/>
					</svg>
				</div>
				<div class="ml-3 flex-1">
					{#if toast.title}
						<h3 class="text-sm font-medium">{toast.title}</h3>
						<p class="mt-1 text-sm">{toast.message}</p>
					{:else}
						<p class="text-sm font-medium">{toast.message}</p>
					{/if}
				</div>
				<div class="ml-4 flex-shrink-0">
					<button
						onclick={() => removeToast(toast.id)}
						class="inline-flex rounded-md text-sm hover:opacity-75 focus:ring-2 focus:ring-offset-2 focus:outline-none"
						aria-label="Close notification"
					>
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	{/each}
</div>
