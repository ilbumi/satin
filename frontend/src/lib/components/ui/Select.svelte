<script lang="ts">
	export type SelectState = 'default' | 'error' | 'success';

	export interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	export interface SelectProps {
		value?: string;
		options?: SelectOption[];
		placeholder?: string;
		label?: string;
		helperText?: string;
		errorText?: string;
		error?: string;
		state?: SelectState;
		disabled?: boolean;
		required?: boolean;
		id?: string;
		name?: string;
		class?: string;
		'data-testid'?: string;
		onchange?: (event: Event) => void;
		onfocus?: (event: FocusEvent) => void;
		onblur?: (event: FocusEvent) => void;
		children?: import('svelte').Snippet;
	}

	let {
		value = $bindable(''),
		options = [],
		placeholder,
		label,
		helperText,
		errorText,
		error,
		state = 'default',
		disabled = false,
		required = false,
		id,
		name,
		class: className = '',
		'data-testid': dataTestId,
		onchange,
		onfocus,
		onblur,
		children
	}: SelectProps = $props();

	// Generate unique ID if not provided
	const selectId = id || `select-${Math.random().toString(36).substring(2, 11)}`;

	// Base select classes
	const baseClasses =
		'block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-colors';

	// State-specific classes
	const stateClasses = {
		default:
			'ring-gray-300 focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200',
		error:
			'ring-red-300 text-red-900 focus:ring-red-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200',
		success:
			'ring-green-300 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200'
	};

	// Determine actual state and text to show
	const actualState = $derived(error ? 'error' : state);
	const displayText = $derived(error || (actualState === 'error' && errorText) || helperText);
	const textColor = $derived(actualState === 'error' ? 'text-red-600' : 'text-gray-500');

	// Compute final classes
	const computedClasses = $derived(`${baseClasses} ${stateClasses[actualState]} ${className}`);
</script>

<div class="w-full">
	{#if label}
		<label for={selectId} class="mb-2 block text-sm leading-6 font-medium text-gray-900">
			{label}
			{#if required}
				<span class="text-red-500" aria-label="required">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		<select
			bind:value
			{disabled}
			{required}
			{name}
			id={selectId}
			class={computedClasses}
			data-testid={dataTestId}
			aria-invalid={actualState === 'error'}
			aria-describedby={displayText ? `${selectId}-description` : undefined}
			{onchange}
			{onfocus}
			{onblur}
		>
			{#if placeholder}
				<option value="" disabled selected={!value}>{placeholder}</option>
			{/if}

			{#if children}
				{@render children()}
			{:else}
				{#each options as option (option.value)}
					<option value={option.value} disabled={option.disabled}>
						{option.label}
					</option>
				{/each}
			{/if}
		</select>

		<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
			<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path
					fill-rule="evenodd"
					d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04L10 14.148l2.7-1.908a.75.75 0 111.1 1.02l-3.25 2.5a.75.75 0 01-.9 0l-3.25-2.5a.75.75 0 01.04-1.06z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>

		{#if state === 'error'}
			<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-8">
				<svg
					class="h-5 w-5 text-red-500"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		{:else if state === 'success'}
			<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-8">
				<svg
					class="h-5 w-5 text-green-500"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		{/if}
	</div>

	{#if displayText}
		<p id="{selectId}-description" class="mt-2 text-sm {textColor}">
			{displayText}
		</p>
	{/if}
</div>
