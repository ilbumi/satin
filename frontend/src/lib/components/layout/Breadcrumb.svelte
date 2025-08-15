<script lang="ts">
	import { page } from '$app/state';

	interface BreadcrumbItem {
		label: string;
		href?: string;
		icon?: string;
	}

	let { customBreadcrumbs }: { customBreadcrumbs?: BreadcrumbItem[] } = $props();

	// Function to generate breadcrumbs from the current route
	function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
		if (customBreadcrumbs) {
			return customBreadcrumbs;
		}

		const segments = pathname.split('/').filter(Boolean);
		const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/', icon: '🏠' }];

		// Route mapping for better labels
		const routeLabels: Record<string, { label: string; icon: string }> = {
			projects: { label: 'Projects', icon: '📁' },
			tasks: { label: 'Tasks', icon: '✅' },
			images: { label: 'Images', icon: '🖼️' },
			annotations: { label: 'Annotations', icon: '✏️' },
			exports: { label: 'Exports', icon: '📤' },
			settings: { label: 'Settings', icon: '⚙️' }
		};

		if (pathname === '/') {
			return breadcrumbs;
		}

		let currentPath = '';

		segments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const isLast = index === segments.length - 1;

			// Check if it's an ID (simple check for now)
			const isId = /^[a-zA-Z0-9-_]{8,}$/.test(segment);

			if (isId) {
				// For IDs, don't make them clickable and show truncated version
				breadcrumbs.push({
					label: `#${segment.slice(0, 8)}...`,
					icon: '🔗'
				});
			} else {
				const routeInfo = routeLabels[segment];
				breadcrumbs.push({
					label: routeInfo?.label || segment.charAt(0).toUpperCase() + segment.slice(1),
					href: isLast ? undefined : currentPath,
					icon: routeInfo?.icon || '📄'
				});
			}
		});

		return breadcrumbs;
	}

	let breadcrumbs = $derived(generateBreadcrumbs(page.url.pathname));
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
