<script lang="ts">
	import { Button, Card, Input, Select, type SelectOption } from '$lib/components/ui';

	// Placeholder settings - will be replaced with real user preferences in Block 11
	let userSettings = $state({
		name: 'John Doe',
		email: 'john.doe@example.com',
		theme: 'light',
		language: 'en',
		notifications: {
			email: true,
			browser: true,
			taskAssignments: true,
			exportComplete: false
		},
		annotationDefaults: {
			tool: 'bounding_box',
			strokeWidth: 2,
			fillOpacity: 0.3,
			autoSave: true,
			autosaveInterval: 5
		}
	});

	// String representations for number inputs (required by Input component)
	let strokeWidthStr = $derived(userSettings.annotationDefaults.strokeWidth.toString());
	let fillOpacityStr = $derived(userSettings.annotationDefaults.fillOpacity.toString());
	let autosaveIntervalStr = $derived(userSettings.annotationDefaults.autosaveInterval.toString());

	// Functions to handle string input changes
	function updateStrokeWidth(value: string) {
		const num = parseFloat(value);
		if (!isNaN(num) && num >= 1 && num <= 10) {
			userSettings.annotationDefaults.strokeWidth = num;
		}
	}

	function updateFillOpacity(value: string) {
		const num = parseFloat(value);
		if (!isNaN(num) && num >= 0 && num <= 1) {
			userSettings.annotationDefaults.fillOpacity = num;
		}
	}

	function updateAutosaveInterval(value: string) {
		const num = parseInt(value);
		if (!isNaN(num) && num >= 1 && num <= 60) {
			userSettings.annotationDefaults.autosaveInterval = num;
		}
	}

	const themeOptions: SelectOption[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	const languageOptions: SelectOption[] = [
		{ value: 'en', label: 'English' },
		{ value: 'es', label: 'Español' },
		{ value: 'fr', label: 'Français' },
		{ value: 'de', label: 'Deutsch' }
	];

	const toolOptions: SelectOption[] = [
		{ value: 'bounding_box', label: 'Bounding Box' },
		{ value: 'polygon', label: 'Polygon' },
		{ value: 'classification', label: 'Classification' }
	];

	function saveSettings() {
		// Placeholder - will implement actual saving in later blocks
		alert('Settings saved successfully!');
	}

	function resetSettings() {
		if (confirm('Are you sure you want to reset all settings to defaults?')) {
			// Reset to defaults
			userSettings = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				theme: 'light',
				language: 'en',
				notifications: {
					email: true,
					browser: true,
					taskAssignments: true,
					exportComplete: false
				},
				annotationDefaults: {
					tool: 'bounding_box',
					strokeWidth: 2,
					fillOpacity: 0.3,
					autoSave: true,
					autosaveInterval: 5
				}
			};
		}
	}
</script>

<svelte:head>
	<title>Settings - Satin</title>
</svelte:head>

<div class="p-6">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Settings</h1>
		<p class="mt-2 text-gray-600">Manage your account and application preferences</p>
	</div>

	<div class="max-w-4xl space-y-8">
		<!-- Profile Settings -->
		<Card>
			{#snippet header()}
				<h2 class="text-xl font-semibold text-gray-900">Profile</h2>
			{/snippet}

			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<Input
						label="Full Name"
						bind:value={userSettings.name}
						placeholder="Enter your full name"
					/>
				</div>
				<div>
					<Input
						label="Email Address"
						type="email"
						bind:value={userSettings.email}
						placeholder="Enter your email"
						readonly
					/>
				</div>
			</div>
		</Card>

		<!-- Appearance Settings -->
		<Card>
			{#snippet header()}
				<h2 class="text-xl font-semibold text-gray-900">Appearance</h2>
			{/snippet}

			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<label for="theme" class="mb-2 block text-sm font-medium text-gray-700"> Theme </label>
					<Select
						options={themeOptions}
						bind:value={userSettings.theme}
						placeholder="Select theme"
					/>
				</div>
				<div>
					<label for="language" class="mb-2 block text-sm font-medium text-gray-700">
						Language
					</label>
					<Select
						options={languageOptions}
						bind:value={userSettings.language}
						placeholder="Select language"
					/>
				</div>
			</div>
		</Card>

		<!-- Notification Settings -->
		<Card>
			{#snippet header()}
				<h2 class="text-xl font-semibold text-gray-900">Notifications</h2>
			{/snippet}

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<label for="email-notifications" class="text-sm font-medium text-gray-700">
							Email Notifications
						</label>
						<p class="text-sm text-gray-500">Receive notifications via email</p>
					</div>
					<input
						id="email-notifications"
						type="checkbox"
						bind:checked={userSettings.notifications.email}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
				</div>

				<div class="flex items-center justify-between">
					<div>
						<label for="browser-notifications" class="text-sm font-medium text-gray-700">
							Browser Notifications
						</label>
						<p class="text-sm text-gray-500">Show notifications in your browser</p>
					</div>
					<input
						id="browser-notifications"
						type="checkbox"
						bind:checked={userSettings.notifications.browser}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
				</div>

				<div class="flex items-center justify-between">
					<div>
						<label for="task-assignments" class="text-sm font-medium text-gray-700">
							Task Assignments
						</label>
						<p class="text-sm text-gray-500">Notify when assigned new tasks</p>
					</div>
					<input
						id="task-assignments"
						type="checkbox"
						bind:checked={userSettings.notifications.taskAssignments}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
				</div>

				<div class="flex items-center justify-between">
					<div>
						<label for="export-complete" class="text-sm font-medium text-gray-700">
							Export Completion
						</label>
						<p class="text-sm text-gray-500">Notify when data exports are ready</p>
					</div>
					<input
						id="export-complete"
						type="checkbox"
						bind:checked={userSettings.notifications.exportComplete}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
				</div>
			</div>
		</Card>

		<!-- Annotation Defaults -->
		<Card>
			{#snippet header()}
				<h2 class="text-xl font-semibold text-gray-900">Annotation Defaults</h2>
			{/snippet}

			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<label for="default-tool" class="mb-2 block text-sm font-medium text-gray-700">
						Default Tool
					</label>
					<Select
						options={toolOptions}
						bind:value={userSettings.annotationDefaults.tool}
						placeholder="Select default tool"
					/>
				</div>

				<div>
					<Input
						label="Stroke Width (1-10)"
						type="number"
						value={strokeWidthStr}
						oninput={(e) => updateStrokeWidth((e.target as HTMLInputElement).value)}
					/>
				</div>

				<div>
					<Input
						label="Fill Opacity (0-1)"
						type="number"
						value={fillOpacityStr}
						oninput={(e) => updateFillOpacity((e.target as HTMLInputElement).value)}
					/>
				</div>

				<div>
					<Input
						label="Auto-save Interval (1-60 minutes)"
						type="number"
						value={autosaveIntervalStr}
						oninput={(e) => updateAutosaveInterval((e.target as HTMLInputElement).value)}
					/>
				</div>
			</div>

			<div class="mt-6">
				<div class="flex items-center">
					<input
						id="auto-save"
						type="checkbox"
						bind:checked={userSettings.annotationDefaults.autoSave}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="auto-save" class="ml-2 text-sm font-medium text-gray-700">
						Enable auto-save
					</label>
				</div>
			</div>
		</Card>

		<!-- Data & Privacy -->
		<Card>
			{#snippet header()}
				<h2 class="text-xl font-semibold text-gray-900">Data & Privacy</h2>
			{/snippet}

			<div class="space-y-4">
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-700">Export Your Data</h3>
					<p class="mb-3 text-sm text-gray-500">Download all your data and settings</p>
					<Button variant="secondary" size="sm">Download Data</Button>
				</div>

				<hr class="border-gray-200" />

				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-700">Delete Account</h3>
					<p class="mb-3 text-sm text-gray-500">Permanently delete your account and all data</p>
					<Button variant="danger" size="sm">Delete Account</Button>
				</div>
			</div>
		</Card>

		<!-- Action Buttons -->
		<div class="flex justify-between">
			<Button variant="ghost" onclick={resetSettings}>Reset to Defaults</Button>
			<div class="flex space-x-3">
				<Button variant="secondary">Cancel</Button>
				<Button variant="primary" onclick={saveSettings}>Save Settings</Button>
			</div>
		</div>
	</div>
</div>
