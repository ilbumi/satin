<script lang="ts">
	import { page } from '$app/stores';

	interface Props {
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
	}

	let { maxWidth = 'full' }: Props = $props();

	const maxWidthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		full: 'max-w-full'
	};

	let mobileMenuOpen = $state(false);

	const navigationItems = [
		{ name: 'Home', href: '/', shortcut: '⌘1' },
		{ name: 'Images', href: '/images', shortcut: '⌘2' },
		{ name: 'Annotate', href: '/annotate', shortcut: '⌘3' },
		{ name: 'Export', href: '/export', shortcut: '⌘4' }
	];
</script>

<header class="border-b border-gray-200 bg-white shadow-sm">
	<div class="mx-auto px-4 sm:px-6 lg:px-8 {maxWidthClasses[maxWidth]}">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo/Brand -->
			<div class="flex items-center">
				<a href="/" class="flex items-center">
					<h1 class="text-xl font-semibold text-gray-900">Satin</h1>
					<span class="ml-2 text-xs text-gray-500">ML Annotation</span>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<nav class="hidden space-x-8 md:flex">
				{#each navigationItems as item (item.href)}
					<a
						href={item.href}
						class="group px-3 py-2 text-sm font-medium transition-colors duration-200 {$page.url
							.pathname === item.href
							? 'text-blue-600'
							: 'text-gray-500 hover:text-gray-900'}"
						title="Navigate to {item.name} ({item.shortcut})"
					>
						{item.name}
						<span class="ml-1 text-xs opacity-50 group-hover:opacity-75">
							{item.shortcut}
						</span>
					</a>
				{/each}
			</nav>

			<!-- User Menu (placeholder) -->
			<div class="hidden md:flex md:items-center md:space-x-4">
				<button
					class="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
					aria-label="User menu"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
				</button>
			</div>

			<!-- Mobile menu button -->
			<button
				class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			>
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					{#if !mobileMenuOpen}
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					{:else}
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile Navigation Menu -->
	{#if mobileMenuOpen}
		<div class="border-t border-gray-200 bg-white md:hidden">
			<div class="space-y-1 px-4 py-2">
				{#each navigationItems as item (item.href)}
					<a
						href={item.href}
						class="block px-3 py-2 text-base font-medium transition-colors duration-200 {$page.url
							.pathname === item.href
							? 'text-blue-600'
							: 'text-gray-500 hover:text-gray-900'}"
						onclick={() => (mobileMenuOpen = false)}
					>
						{item.name}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</header>
