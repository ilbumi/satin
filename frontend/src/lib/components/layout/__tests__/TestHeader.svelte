<script lang="ts">
	let { onToggleSidebar = () => {} }: { onToggleSidebar?: () => void } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: '🏠' },
		{ href: '/projects', label: 'Projects', icon: '📁' },
		{ href: '/tasks', label: 'Tasks', icon: '✅' },
		{ href: '/images', label: 'Images', icon: '🖼️' },
		{ href: '/annotations', label: 'Annotations', icon: '✏️' }
	];

	// Mock current path for testing - always use root path
	const currentPath = '/';
</script>

<header class="border-b border-gray-200 bg-white shadow-sm">
	<div class="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo and App Title -->
			<div class="flex items-center">
				<button
					class="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset lg:hidden"
					onclick={onToggleSidebar}
				>
					<span class="sr-only">Open sidebar</span>
					☰
				</button>

				<div class="ml-4 flex items-center lg:ml-0">
					<span class="text-2xl">🎨</span>
					<h1 class="ml-2 text-xl font-bold text-gray-900">Satin</h1>
				</div>
			</div>

			<!-- Desktop Navigation -->
			<nav class="hidden md:flex md:space-x-8">
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						class="inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors duration-200 {currentPath ===
						item.href
							? 'border-blue-500 text-gray-900'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
					>
						<span class="mr-2">{item.icon}</span>
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- User Menu -->
			<div class="flex items-center space-x-4">
				<!-- Mobile menu button -->
				<button
					class="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset md:hidden"
				>
					<span class="sr-only">Open main menu</span>
					☰
				</button>
			</div>
		</div>
	</div>
</header>
