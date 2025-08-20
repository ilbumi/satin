<script lang="ts">
	import Button from '../Button.svelte';
	import type { ButtonProps } from '../Button.svelte';

	let { content = '', ...buttonProps }: { content?: string } & ButtonProps = $props();
</script>

<Button {...buttonProps}>
	{content}
</Button>
