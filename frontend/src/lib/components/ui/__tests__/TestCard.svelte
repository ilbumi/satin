<script lang="ts">
	import Card from '../Card.svelte';
	import type { CardProps } from '../Card.svelte';

	let {
		content = '',
		headerContent = undefined,
		footerContent = undefined,
		...cardProps
	}: {
		content?: string;
		headerContent?: string;
		footerContent?: string;
	} & CardProps = $props();
</script>

{#snippet headerSnippet()}
	{headerContent}
{/snippet}

{#snippet footerSnippet()}
	{footerContent}
{/snippet}

<Card
	{...cardProps}
	header={headerContent ? headerSnippet : undefined}
	footer={footerContent ? footerSnippet : undefined}
>
	{content}
</Card>
