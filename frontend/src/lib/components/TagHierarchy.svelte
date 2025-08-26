<script lang="ts">
	import { queryStore, getContextClient } from '@urql/svelte';
	import {
		GET_TAG_TREE,
		CREATE_TAG,
		UPDATE_TAG,
		DELETE_TAG,
		type GetTagTreeQuery,
		type TagData,
		type TagCreateInput,
		type TagUpdateInput,
		buildTagTree
	} from '$lib/graphql/operations/tags';
	import { SvelteSet } from 'svelte/reactivity';

	let { editable = true } = $props();

	const client = getContextClient();
	const tagTreeQuery = queryStore<GetTagTreeQuery>({
		query: GET_TAG_TREE,
		variables: { rootId: null },
		client
	});

	// Build hierarchical tree from flat list
	let tagHierarchy = $derived(() => {
		if ($tagTreeQuery.data?.tagTree) {
			return buildTagTree($tagTreeQuery.data.tagTree);
		}
		return [];
	});

	let expandedIds = new SvelteSet<string>();
	let editingId: string | null = $state(null);
	let showCreateForm = $state(false);

	// Form states
	let editForm = $state({
		name: '',
		description: '',
		color: '',
		parentId: null as string | null
	});

	let createForm = $state({
		name: '',
		description: '',
		color: '',
		parentId: null as string | null
	});

	function toggleExpanded(id: string) {
		if (expandedIds.has(id)) {
			expandedIds.delete(id);
		} else {
			expandedIds.add(id);
		}
		expandedIds = expandedIds;
	}

	function startEdit(tag: TagData) {
		editingId = tag.id;
		editForm = {
			name: tag.name,
			description: tag.description,
			color: tag.color || '',
			parentId: tag.parentId || null
		};
	}

	function startCreate(parentId?: string) {
		showCreateForm = true;
		createForm = {
			name: '',
			description: '',
			color: '',
			parentId: parentId || null
		};
	}

	function cancelEdit() {
		editingId = null;
	}

	function cancelCreate() {
		showCreateForm = false;
	}

	async function saveEdit() {
		if (!editingId) return;

		const input: TagUpdateInput = {};
		const currentTag = findTagById(editingId, tagHierarchy());

		if (editForm.name !== currentTag?.name) input.name = editForm.name;
		if (editForm.description !== currentTag?.description) input.description = editForm.description;
		if (editForm.color !== currentTag?.color) input.color = editForm.color || null;
		if (editForm.parentId !== currentTag?.parentId) input.parentId = editForm.parentId;

		if (Object.keys(input).length > 0) {
			try {
				const result = await client
					.mutation(UPDATE_TAG, {
						id: editingId,
						input
					})
					.toPromise();

				if (result.error) {
					console.error('Update tag error:', result.error);
					return;
				}

				tagTreeQuery.reexecute({});
			} catch (error) {
				console.error('Update tag failed:', error);
			}
		}

		editingId = null;
	}

	async function saveCreate() {
		const input: TagCreateInput = {
			name: createForm.name,
			description: createForm.description || '',
			parentId: createForm.parentId,
			color: createForm.color || null
		};

		try {
			const result = await client.mutation(CREATE_TAG, { input }).toPromise();

			if (result.error) {
				console.error('Create tag error:', result.error);
				return;
			}

			tagTreeQuery.reexecute({});
			showCreateForm = false;
			createForm = { name: '', description: '', color: '', parentId: null };
		} catch (error) {
			console.error('Create tag failed:', error);
		}
	}

	async function deleteTag(id: string) {
		if (confirm('Are you sure? This will delete the tag and all its children.')) {
			try {
				const result = await client.mutation(DELETE_TAG, { id }).toPromise();

				if (result.error) {
					console.error('Delete tag error:', result.error);
					return;
				}

				tagTreeQuery.reexecute({});
			} catch (error) {
				console.error('Delete tag failed:', error);
			}
		}
	}

	function findTagById(id: string, tags: TagData[]): TagData | null {
		for (const tag of tags) {
			if (tag.id === id) return tag;
			if (tag.children) {
				const found = findTagById(id, tag.children);
				if (found) return found;
			}
		}
		return null;
	}
</script>

<div class="tag-hierarchy">
	{#if editable}
		<div class="header">
			<h3>Tags</h3>
			<button class="btn-create" onclick={() => startCreate()}> + Add Tag </button>
		</div>
	{/if}

	{#if showCreateForm}
		<div class="form-overlay">
			<div class="create-form">
				<h4>Create New Tag</h4>
				<div class="form-group">
					<label for="create-name">Name *</label>
					<input
						id="create-name"
						type="text"
						bind:value={createForm.name}
						placeholder="Tag name"
						required
					/>
				</div>
				<div class="form-group">
					<label for="create-description">Description</label>
					<textarea
						id="create-description"
						bind:value={createForm.description}
						placeholder="Optional description"
						rows="2"
					></textarea>
				</div>
				<div class="form-group">
					<label for="create-color">Color</label>
					<input id="create-color" type="color" bind:value={createForm.color} />
				</div>
				<div class="form-actions">
					<button class="btn btn-primary" onclick={saveCreate} disabled={!createForm.name.trim()}>
						Create
					</button>
					<button class="btn btn-secondary" onclick={cancelCreate}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}

	{#if $tagTreeQuery.fetching}
		<div class="loading">Loading tags...</div>
	{:else if $tagTreeQuery.error}
		<div class="error">Error: {$tagTreeQuery.error.message}</div>
	{:else if tagHierarchy().length > 0}
		<div class="tree">
			{#each tagHierarchy() as tag (tag.id)}
				{@render tagNode(tag, 0)}
			{/each}
		</div>
	{:else}
		<div class="empty">No tags found</div>
	{/if}
</div>

{#snippet tagNode(tag: TagData, level: number)}
	<div class="tag-node">
		{#if editingId === tag.id}
			<div class="edit-form" style="padding-left: {level * 2}rem">
				<div class="form-group">
					<input type="text" bind:value={editForm.name} placeholder="Tag name" class="edit-input" />
				</div>
				<div class="form-group">
					<input
						type="text"
						bind:value={editForm.description}
						placeholder="Description"
						class="edit-input"
					/>
				</div>
				<div class="form-group">
					<input type="color" bind:value={editForm.color} class="color-input" />
				</div>
				<div class="edit-actions">
					<button class="btn-save" onclick={saveEdit}>✓</button>
					<button class="btn-cancel" onclick={cancelEdit}>✗</button>
				</div>
			</div>
		{:else}
			<div class="tag-item" style="padding-left: {level * 2}rem">
				{#if tag.children && tag.children.length > 0}
					<button
						class="expand-btn"
						onclick={() => toggleExpanded(tag.id)}
						aria-label={expandedIds.has(tag.id) ? 'Collapse' : 'Expand'}
					>
						{expandedIds.has(tag.id) ? '▼' : '▶'}
					</button>
				{:else}
					<span class="expand-spacer"></span>
				{/if}
				<div class="tag-info">
					{#if tag.color}
						<span class="tag-color" style="background-color: {tag.color}"></span>
					{/if}
					<span class="tag-name">{tag.name}</span>
					{#if tag.description}
						<span class="tag-description">- {tag.description}</span>
					{/if}
					<span class="usage-count">({tag.usageCount})</span>
				</div>
				{#if editable}
					<div class="tag-actions">
						<button class="btn-action" onclick={() => startCreate(tag.id)} title="Add child tag">
							+
						</button>
						<button class="btn-action" onclick={() => startEdit(tag)} title="Edit tag"> ✎ </button>
						<button class="btn-action danger" onclick={() => deleteTag(tag.id)} title="Delete tag">
							✗
						</button>
					</div>
				{/if}
			</div>
		{/if}
		{#if tag.children && tag.children.length > 0 && expandedIds.has(tag.id)}
			{#each tag.children as child (child.id)}
				{@render tagNode(child, level + 1)}
			{/each}
		{/if}
	</div>
{/snippet}

<style>
	.tag-hierarchy {
		width: 100%;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
	}

	.btn-create {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.btn-create:hover {
		background: #2563eb;
	}

	.form-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.create-form {
		background: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		width: 400px;
		max-width: 90vw;
	}

	.create-form h4 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-primary:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	.loading,
	.error,
	.empty {
		padding: 1rem;
		text-align: center;
		color: #666;
	}

	.error {
		color: #dc2626;
	}

	.tree {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background: white;
	}

	.tag-node {
		border-bottom: 1px solid #f3f4f6;
	}

	.tag-node:last-child {
		border-bottom: none;
	}

	.tag-item {
		display: flex;
		align-items: center;
		padding: 0.5rem;
		gap: 0.5rem;
		transition: background-color 0.2s;
	}

	.tag-item:hover {
		background-color: #f9fafb;
	}

	.edit-form {
		display: flex;
		align-items: center;
		padding: 0.5rem;
		gap: 0.5rem;
		background: #f8fafc;
		border-left: 3px solid #3b82f6;
	}

	.edit-input {
		padding: 0.25rem 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	.color-input {
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.edit-actions {
		display: flex;
		gap: 0.25rem;
	}

	.btn-save,
	.btn-cancel {
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-save {
		background: #10b981;
		color: white;
	}

	.btn-save:hover {
		background: #059669;
	}

	.btn-cancel {
		background: #ef4444;
		color: white;
	}

	.btn-cancel:hover {
		background: #dc2626;
	}

	.expand-btn {
		background: none;
		border: none;
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #6b7280;
	}

	.expand-btn:hover {
		background-color: #f3f4f6;
	}

	.expand-spacer {
		width: 1.5rem;
		height: 1.5rem;
	}

	.tag-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.tag-color {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		border: 1px solid #e5e7eb;
	}

	.tag-name {
		font-weight: 500;
		color: #374151;
	}

	.tag-description {
		font-style: italic;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.usage-count {
		font-size: 0.875rem;
		color: #6b7280;
		margin-left: auto;
	}

	.tag-actions {
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.tag-item:hover .tag-actions {
		opacity: 1;
	}

	.btn-action {
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f3f4f6;
		color: #6b7280;
		transition: all 0.2s;
	}

	.btn-action:hover {
		background: #e5e7eb;
		color: #374151;
	}

	.btn-action.danger {
		background: #fef2f2;
		color: #dc2626;
	}

	.btn-action.danger:hover {
		background: #fee2e2;
		color: #b91c1c;
	}
</style>
