# UI Components Library

This directory contains reusable UI components for the Satin frontend application. All components are built with Svelte 5, TypeScript, and Tailwind CSS.

## Components Overview

- **Button** - Primary interactive elements with multiple variants
- **Input** - Form input fields with validation states
- **Select** - Dropdown selection component
- **Modal** - Dialog overlays with customizable content
- **Toast** - Notification system for user feedback
- **Card** - Content containers with consistent styling
- **Spinner** - Loading indicators

## Design System

### Colors

- **Primary**: Blue (`blue-600`, `blue-700`)
- **Secondary**: Gray (`gray-100`, `gray-200`)
- **Danger**: Red (`red-600`, `red-700`)
- **Success**: Green (`green-50`, `green-400`)
- **Warning**: Yellow (`yellow-50`, `yellow-400`)

### Typography

- **Font Family**: System font stack
- **Sizes**: `text-sm`, `text-base`, `text-lg`, `text-xl`
- **Weights**: `font-medium`, `font-semibold`

### Spacing

- **Small**: `px-3 py-2`
- **Medium**: `px-4 py-2`
- **Large**: `px-6 py-3`

## Usage Examples

### Button Component

```svelte
<script>
	import { Button } from '$lib/components/ui';
</script>

<!-- Primary Button -->
<Button variant="primary" onclick={() => console.log('Clicked!')}>Save Changes</Button>

<!-- Secondary Button -->
<Button variant="secondary" size="sm">Cancel</Button>

<!-- Danger Button -->
<Button variant="danger" loading={isDeleting}>Delete Project</Button>

<!-- Ghost Button -->
<Button variant="ghost" disabled={true}>Disabled Action</Button>
```

**Props:**

- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost'`
- `size`: `'sm' | 'md' | 'lg'`
- `loading`: boolean - shows spinner and disables button
- `disabled`: boolean - disables button interaction
- `type`: `'button' | 'submit' | 'reset'`

### Input Component

```svelte
<script>
	import { Input } from '$lib/components/ui';

	let email = $state('');
	let password = $state('');
</script>

<!-- Text Input -->
<Input type="text" placeholder="Enter your name" bind:value={name} />

<!-- Email Input with Label -->
<Input
	type="email"
	label="Email Address"
	placeholder="you@example.com"
	bind:value={email}
	required={true}
/>

<!-- Password Input with Error -->
<Input
	type="password"
	label="Password"
	bind:value={password}
	error="Password must be at least 8 characters"
	state="error"
/>

<!-- Disabled Input -->
<Input label="Project ID" value="proj_12345" disabled={true} />
```

**Props:**

- `type`: `'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'`
- `label`: string - input label text
- `placeholder`: string - placeholder text
- `value`: string - input value (bindable)
- `error`: string - error message to display
- `state`: `'default' | 'error' | 'success'`
- `disabled`: boolean
- `required`: boolean

### Select Component

```svelte
<script>
	import { Select } from '$lib/components/ui';

	let selectedStatus = $state('active');

	const statusOptions = [
		{ value: 'active', label: 'Active' },
		{ value: 'inactive', label: 'Inactive' },
		{ value: 'archived', label: 'Archived' }
	];
</script>

<Select
	label="Project Status"
	options={statusOptions}
	bind:value={selectedStatus}
	placeholder="Choose status..."
/>

<!-- With Error State -->
<Select
	label="Category"
	options={categories}
	bind:value={category}
	state="error"
	error="Please select a category"
	required={true}
/>
```

**Props:**

- `label`: string - select label text
- `options`: `Array<{value: string, label: string}>` - available options
- `value`: string - selected value (bindable)
- `placeholder`: string - placeholder text when no option selected
- `state`: `'default' | 'error' | 'success'`
- `error`: string - error message
- `disabled`: boolean
- `required`: boolean

### Modal Component

```svelte
<script>
	import { Modal, Button } from '$lib/components/ui';

	let showModal = $state(false);
	let showConfirmModal = $state(false);
</script>

<!-- Basic Modal -->
<Modal bind:open={showModal} title="Edit Project" size="md">
	<p>Modal content goes here...</p>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (showModal = false)}>Cancel</Button>
		<Button variant="primary" onclick={handleSave}>Save Changes</Button>
	{/snippet}
</Modal>

<!-- Confirmation Modal -->
<Modal bind:open={showConfirmModal} title="Delete Project" size="sm" closeOnBackdropClick={false}>
	<p>Are you sure you want to delete this project? This action cannot be undone.</p>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (showConfirmModal = false)}>Cancel</Button>
		<Button variant="danger" onclick={handleDelete}>Delete</Button>
	{/snippet}
</Modal>
```

**Props:**

- `open`: boolean - modal visibility (bindable)
- `title`: string - modal title
- `size`: `'sm' | 'md' | 'lg' | 'xl' | 'full'`
- `showCloseButton`: boolean - show X button in header
- `closeOnBackdropClick`: boolean - close when clicking outside
- `closeOnEscape`: boolean - close on Escape key
- `onClose`: function - callback when modal closes

**Snippets:**

- `header`: Custom header content
- `footer`: Custom footer content
- `children`: Main modal content (default)

### Toast Component

```svelte
<script>
	import { Toast } from '$lib/components/ui';

	let showToast = $state(false);

	function showSuccess() {
		showToast = true;
	}
</script>

<!-- Success Toast -->
{#if showToast}
	<Toast
		type="success"
		title="Success"
		message="Project saved successfully!"
		onClose={() => (showToast = false)}
		duration={3000}
	/>
{/if}

<!-- Error Toast -->
<Toast
	type="error"
	title="Error"
	message="Failed to save project. Please try again."
	persistent={true}
	showCloseButton={true}
/>

<!-- Info Toast -->
<Toast type="info" message="Your session will expire in 5 minutes" position="bottom-center" />
```

**Props:**

- `type`: `'success' | 'error' | 'warning' | 'info'`
- `title`: string - toast title (optional)
- `message`: string - toast message
- `duration`: number - auto-dismiss time in ms (default: 5000)
- `position`: `'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'`
- `persistent`: boolean - prevent auto-dismiss
- `showCloseButton`: boolean - show close button
- `onClose`: function - callback when toast is closed

### Card Component

```svelte
<script>
	import { Card, Button } from '$lib/components/ui';
</script>

<!-- Basic Card -->
<Card>
	<h3>Project Statistics</h3>
	<p>Total images: 150</p>
	<p>Annotated: 45</p>
</Card>

<!-- Card with Header and Footer -->
<Card variant="bordered">
	{#snippet header()}
		<h2 class="text-lg font-semibold">Recent Projects</h2>
	{/snippet}

	<div class="space-y-2">
		<div>Medical Images Dataset</div>
		<div>Traffic Signs Collection</div>
		<div>Wildlife Photography</div>
	</div>

	{#snippet footer()}
		<Button variant="secondary" size="sm">View All Projects</Button>
	{/snippet}
</Card>
```

**Props:**

- `variant`: `'default' | 'bordered'`
- `padding`: boolean - add padding to content (default: true)

**Snippets:**

- `header`: Card header content
- `footer`: Card footer content
- `children`: Main card content (default)

### Spinner Component

```svelte
<script>
	import { Spinner } from '$lib/components/ui';
</script>

<!-- Small Spinner -->
<Spinner size="sm" />

<!-- Medium Spinner (default) -->
<Spinner />

<!-- Large Spinner -->
<Spinner size="lg" />

<!-- Extra Large Spinner -->
<Spinner size="xl" />

<!-- With Text -->
<div class="flex items-center space-x-3">
	<Spinner size="md" />
	<span>Loading projects...</span>
</div>
```

**Props:**

- `size`: `'sm' | 'md' | 'lg' | 'xl'`

## Accessibility Features

All components include proper accessibility features:

- **Semantic HTML**: Proper use of semantic elements
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard interaction support
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG compliant color ratios

## Testing

Each component includes comprehensive unit tests:

```bash
# Run all UI component tests
pnpm test:unit src/lib/components/ui

# Run specific component test
pnpm test:unit src/lib/components/ui/Button.svelte.test.ts
```

## Customization

Components use Tailwind CSS classes and can be customized by:

1. **CSS Classes**: Pass additional classes via the `class` prop
2. **CSS Variables**: Override component-specific CSS variables
3. **Theme Configuration**: Modify Tailwind config for global changes

Example:

```svelte
<Button class="mb-4 w-full shadow-lg" variant="primary">Custom Styled Button</Button>
```
