<script lang="ts">
	import Modal from '../Modal.svelte';
	import type { ModalProps } from '../Modal.svelte';

	let {
		content = '',
		headerContent = undefined,
		footerContent = undefined,
		...modalProps
	}: {
		content?: string;
		headerContent?: string;
		footerContent?: string;
	} & ModalProps = $props();
</script>

{#snippet headerSnippet()}
	{headerContent}
{/snippet}

{#snippet footerSnippet()}
	{footerContent}
{/snippet}

<Modal
	{...modalProps}
	header={headerContent ? headerSnippet : undefined}
	footer={footerContent ? footerSnippet : undefined}
>
	{content}
</Modal>
