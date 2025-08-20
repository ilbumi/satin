<script lang="ts">
	interface BreadcrumbItem {
		label: string;
		href?: string;
		icon?: string;
	}

	let { customBreadcrumbs }: { customBreadcrumbs?: BreadcrumbItem[] } = $props();

	// Default breadcrumb for testing
	const defaultBreadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/', icon: '🏠' }];

	const breadcrumbs = customBreadcrumbs || defaultBreadcrumbs;
</script>

<nav class="flex items-center space-x-2 text-sm text-gray-600" aria-label="Breadcrumb">
	<ol class="flex items-center space-x-2">
		{#each breadcrumbs as crumb, index (crumb.label)}
			<li class="flex items-center">
				{#if index > 0}
					<svg class="mx-2 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}

				{#if crumb.href}
					<a
						href={crumb.href}
						class="inline-flex items-center text-gray-500 transition-colors duration-150 hover:text-gray-700"
						aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
					>
						{#if crumb.icon}
							<span class="mr-1">{crumb.icon}</span>
						{/if}
						{crumb.label}
					</a>
				{:else}
					<span class="inline-flex items-center font-medium text-gray-900" aria-current="page">
						{#if crumb.icon}
							<span class="mr-1">{crumb.icon}</span>
						{/if}
						{crumb.label}
					</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
