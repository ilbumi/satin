# Component Styling Guidelines

This document outlines the consistent styling approach for Svelte components in the Satin frontend.

## Core Principles

1. **Computed Classes in Script Section**: All dynamic styling should be computed in the `<script>` section using `$derived()`
2. **Consistent Naming**: Use `computedClasses` for final class strings
3. **Utility Functions**: Leverage the styling utilities from `@/lib/core/styles/utils`
4. **Type Safety**: Use TypeScript for variant types and styling props

## Patterns

### Basic Component with Variants

```svelte
<script lang="ts">
	import { cn, createVariantClassFn } from '$lib/core/styles/utils';

	type Variant = 'primary' | 'secondary' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: Variant;
		size?: Size;
		class?: string;
	}

	let { variant = 'primary', size = 'md', class: className = '' }: Props = $props();

	// Base classes
	const baseClasses =
		'inline-flex items-center justify-center font-medium rounded-md transition-colors';

	// Variant classes
	const variantClasses = {
		primary: 'bg-blue-600 hover:bg-blue-700 text-white',
		secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
		danger: 'bg-red-600 hover:bg-red-700 text-white'
	};

	// Size classes
	const sizeClasses = {
		sm: 'px-3 py-2 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};

	// Computed final classes
	const computedClasses = $derived(
		cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
	);
</script>

<button class={computedClasses}>
	{@render children?.()}
</button>
```

### Using Utility Functions

```svelte
<script lang="ts">
	import { cn, buttonBase, statusColors, transition, focusRing } from '$lib/core/styles/utils';

	type Status = 'success' | 'error' | 'warning' | 'info';

	let { status = 'info', class: className = '' } = $props();

	// Use predefined utilities
	const computedClasses = $derived(
		cn(buttonBase, statusColors[status].bg, statusColors[status].text, transition.all, className)
	);
</script>
```

### Conditional Classes

```svelte
<script lang="ts">
	import { cn } from '$lib/core/styles/utils';

	let { isActive = false, isDisabled = false, class: className = '' } = $props();

	const baseClasses = 'px-4 py-2 rounded-md';

	const computedClasses = $derived(
		cn(
			baseClasses,
			isActive && 'bg-blue-600 text-white',
			isDisabled && 'opacity-50 cursor-not-allowed',
			!isActive && !isDisabled && 'bg-gray-100 text-gray-900',
			className
		)
	);
</script>
```

## When to Use Each Approach

### ✅ Computed Classes (Preferred)

- Dynamic styling based on props or state
- Multiple variants or conditional classes
- Complex styling logic
- Reusable components in the UI library

### ✅ Inline Classes (Acceptable)

- Simple, static classes
- Layout-specific styles in page components
- One-off styling that won't be reused

### ❌ Avoid

- Computing classes in the template with ternary operators
- Mixing computed and inline approaches within the same component
- Inconsistent naming (use `computedClasses`, not `classes`, `finalClasses`, etc.)

## File Organization

```
src/lib/core/styles/
├── utils.ts           # Utility functions and constants
├── README.md          # This file
└── components/        # Component-specific styling utilities (if needed)
```

## Migration Guide

When updating existing components:

1. **Identify dynamic classes**: Look for template-based class computation
2. **Move to script section**: Create `const computedClasses = $derived(...)`
3. **Use utilities**: Replace hardcoded classes with utility constants
4. **Add types**: Define proper TypeScript interfaces for props
5. **Test**: Ensure visual appearance remains unchanged

## Examples in Codebase

- ✅ `Button.svelte` - Proper variant-based styling
- ✅ `Modal.svelte` - Uses size constants
- ✅ `ConnectionStatus.svelte` - Computed conditional classes
- ❌ `+page.svelte` (old) - Mixed inline and dynamic classes

## Naming Conventions

- `baseClasses` - Core structural classes
- `variantClasses` - Variant-specific styles object
- `sizeClasses` - Size-specific styles object
- `computedClasses` - Final computed class string
- `className` - External class prop (destructured from `class`)

## Benefits

1. **Consistency**: Predictable patterns across components
2. **Maintainability**: Centralized styling logic
3. **Performance**: Better tree-shaking of unused styles
4. **Type Safety**: Compile-time checking of variants
5. **Readability**: Clear separation of logic and presentation
