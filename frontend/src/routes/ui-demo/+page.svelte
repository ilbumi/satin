<script lang="ts">
	import {
		Button,
		Input,
		Select,
		Modal,
		Toast,
		Spinner,
		Card,
		type SelectOption
	} from '$lib/components/ui';

	let showModal = $state(false);
	let showToast = $state(false);
	let inputValue = $state('');
	let selectValue = $state('');

	const selectOptions: SelectOption[] = [
		{ value: 'option1', label: 'Option 1' },
		{ value: 'option2', label: 'Option 2' },
		{ value: 'option3', label: 'Option 3' }
	];

	function handleButtonClick() {
		alert('Button clicked!');
	}

	function showToastMessage() {
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}
</script>

<svelte:head>
	<title>UI Components Demo</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-8 p-8">
	<h1 class="mb-8 text-3xl font-bold">UI Components Demo</h1>

	<!-- Buttons -->
	<Card>
		{#snippet header()}
			<h2 class="text-xl font-semibold">Buttons</h2>
		{/snippet}

		<div class="space-y-4">
			<div class="flex flex-wrap gap-4">
				<Button variant="primary" onclick={handleButtonClick}>Primary Button</Button>
				<Button variant="secondary" onclick={handleButtonClick}>Secondary Button</Button>
				<Button variant="danger" onclick={handleButtonClick}>Danger Button</Button>
				<Button variant="ghost" onclick={handleButtonClick}>Ghost Button</Button>
			</div>

			<div class="flex flex-wrap gap-4">
				<Button size="sm">Small Button</Button>
				<Button size="md">Medium Button</Button>
				<Button size="lg">Large Button</Button>
			</div>

			<div class="flex flex-wrap gap-4">
				<Button disabled>Disabled Button</Button>
				<Button loading>Loading Button</Button>
			</div>
		</div>
	</Card>

	<!-- Inputs -->
	<Card>
		{#snippet header()}
			<h2 class="text-xl font-semibold">Inputs</h2>
		{/snippet}

		<div class="max-w-md space-y-4">
			<Input
				bind:value={inputValue}
				label="Name"
				placeholder="Enter your name"
				helperText="Please enter your full name"
				required
			/>

			<Input
				type="email"
				label="Email"
				placeholder="Enter your email"
				state="success"
				helperText="Email looks good!"
			/>

			<Input
				type="password"
				label="Password"
				placeholder="Enter your password"
				state="error"
				errorText="Password must be at least 8 characters"
			/>

			<Input label="Disabled Input" disabled value="Cannot edit this" />
		</div>
	</Card>

	<!-- Select -->
	<Card>
		{#snippet header()}
			<h2 class="text-xl font-semibold">Select</h2>
		{/snippet}

		<div class="max-w-md space-y-4">
			<Select
				bind:value={selectValue}
				options={selectOptions}
				label="Choose Option"
				placeholder="Select an option"
				helperText="Please select one option"
			/>

			<Select
				options={selectOptions}
				label="Required Select"
				state="error"
				errorText="This field is required"
				required
			/>

			<Select options={selectOptions} label="Disabled Select" disabled />
		</div>
	</Card>

	<!-- Spinner -->
	<Card>
		{#snippet header()}
			<h2 class="text-xl font-semibold">Spinners</h2>
		{/snippet}

		<div class="flex flex-wrap items-center gap-8">
			<div class="flex flex-col items-center gap-2">
				<Spinner size="xs" />
				<span class="text-sm">XS</span>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Spinner size="sm" />
				<span class="text-sm">Small</span>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Spinner size="md" />
				<span class="text-sm">Medium</span>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Spinner size="lg" />
				<span class="text-sm">Large</span>
			</div>
			<div class="flex flex-col items-center gap-2">
				<Spinner size="xl" />
				<span class="text-sm">XL</span>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap items-center gap-4">
			<Spinner color="text-red-500" />
			<Spinner color="text-green-500" />
			<Spinner color="text-yellow-500" />
			<Spinner color="text-purple-500" />
		</div>
	</Card>

	<!-- Modal & Toast -->
	<Card>
		{#snippet header()}
			<h2 class="text-xl font-semibold">Modal & Toast</h2>
		{/snippet}

		<div class="flex flex-wrap gap-4">
			<Button onclick={() => (showModal = true)}>Open Modal</Button>
			<Button onclick={showToastMessage}>Show Toast</Button>
		</div>
	</Card>

	<!-- Cards -->
	<Card variant="bordered">
		{#snippet header()}
			<h2 class="text-xl font-semibold">Card Variants</h2>
		{/snippet}

		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Card variant="default">
				<h3 class="mb-2 font-semibold">Default Card</h3>
				<p class="text-gray-600">This is a default card with shadow and ring.</p>
			</Card>

			<Card variant="bordered">
				<h3 class="mb-2 font-semibold">Bordered Card</h3>
				<p class="text-gray-600">This is a bordered card without shadow.</p>
			</Card>

			<Card variant="elevated">
				<h3 class="mb-2 font-semibold">Elevated Card</h3>
				<p class="text-gray-600">This is an elevated card with larger shadow.</p>
			</Card>
		</div>
	</Card>
</div>

<!-- Modal -->
{#if showModal}
	<Modal bind:open={showModal} title="Example Modal" size="md" onclose={() => (showModal = false)}>
		<div class="space-y-4">
			<p>This is an example modal dialog. You can put any content here.</p>
			<Input label="Name" placeholder="Enter your name" />
			<Select options={selectOptions} label="Choose Option" placeholder="Select an option" />
		</div>

		{#snippet footer()}
			<div class="flex gap-2">
				<Button variant="ghost" onclick={() => (showModal = false)}>Cancel</Button>
				<Button variant="primary" onclick={() => (showModal = false)}>Save</Button>
			</div>
		{/snippet}
	</Modal>
{/if}

<!-- Toast -->
{#if showToast}
	<Toast
		type="success"
		title="Success!"
		message="This is a success toast notification."
		onclose={() => (showToast = false)}
	/>
{/if}
