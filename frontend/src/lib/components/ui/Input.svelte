<script lang="ts">
	export type InputType = 'text' | 'email' | 'password' | 'search' | 'url' | 'tel' | 'number';
	export type InputState = 'default' | 'error' | 'success';

	export interface InputProps {
		type?: InputType;
		value?: string;
		placeholder?: string;
		label?: string;
		helperText?: string;
		errorText?: string;
		error?: string;
		state?: InputState;
		disabled?: boolean;
		required?: boolean;
		readonly?: boolean;
		id?: string;
		name?: string;
		class?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		onfocus?: (event: FocusEvent) => void;
		onblur?: (event: FocusEvent) => void;
	}

	let {
		type = 'text',
		value = $bindable(''),
		placeholder,
		label,
		helperText,
		errorText,
		error,
		state = 'default',
		disabled = false,
		required = false,
		readonly = false,
		id,
		name,
		class: className = '',
		autocomplete,
		oninput,
		onchange,
		onfocus,
		onblur
	}: InputProps = $props();

	// Generate unique ID if not provided
	const inputId = id || `input-${Math.random().toString(36).substring(2, 11)}`;

	// Base input classes
	const baseClasses =
		'block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-colors';

	// State-specific classes
	const stateClasses = {
		default:
			'ring-gray-300 focus:ring-blue-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200',
		error:
			'ring-red-300 text-red-900 placeholder:text-red-300 focus:ring-red-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200',
		success:
			'ring-green-300 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200'
	};

	// Determine actual state (use error if provided)
	const actualState = $derived(error ? 'error' : state);

	// Compute final classes
	const computedClasses = $derived(`${baseClasses} ${stateClasses[actualState]} ${className}`);

	// Determine which text to show below the input
	const displayText = $derived(error || (actualState === 'error' && errorText) || helperText);
	const textColor = $derived(actualState === 'error' ? 'text-red-600' : 'text-gray-500');
</script>

<div class="w-full">
	{#if label}
		<label for={inputId} class="mb-2 block text-sm leading-6 font-medium text-gray-900">
			{label}
			{#if required}
				<span class="text-red-500" aria-label="required">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		<input
			{type}
			bind:value
			{placeholder}
			{disabled}
			{required}
			{readonly}
			{name}
			{autocomplete}
			id={inputId}
			class={computedClasses}
			aria-invalid={actualState === 'error'}
			aria-describedby={displayText ? `${inputId}-description` : undefined}
			{oninput}
			{onchange}
			{onfocus}
			{onblur}
		/>

		{#if state === 'error'}
			<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
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
			<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
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
		<p id="{inputId}-description" class="mt-2 text-sm {textColor}">
			{displayText}
		</p>
	{/if}
</div>
