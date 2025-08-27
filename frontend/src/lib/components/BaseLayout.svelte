<script lang="ts">
	import Header from './Header.svelte';

	interface Props {
		title?: string;
		children?: import('svelte').Snippet;
		showHeader?: boolean;
		showFooter?: boolean;
		maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
	}

	let {
		title = 'Satin',
		children,
		showHeader = true,
		showFooter = false,
		maxWidth = 'full'
	}: Props = $props();

	const maxWidthClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
		'2xl': 'max-w-2xl',
		full: 'max-w-full'
	};
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50">
	{#if showHeader}
		<Header {maxWidth} />
	{/if}

	<main class="flex-1">
		<div class="mx-auto px-4 sm:px-6 lg:px-8 {maxWidthClasses[maxWidth]} py-8">
			{#if children}
				{@render children()}
			{/if}
		</div>
	</main>

	{#if showFooter}
		<footer class="border-t border-gray-200 bg-white">
			<div class="mx-auto px-4 sm:px-6 lg:px-8 {maxWidthClasses[maxWidth]}">
				<div class="py-4 text-center text-sm text-gray-500">
					© 2025 Satin - Image Annotation Tool
				</div>
			</div>
		</footer>
	{/if}
</div>
