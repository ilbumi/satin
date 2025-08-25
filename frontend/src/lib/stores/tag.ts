import { writable, derived } from 'svelte/store';
import type { Tag } from '$lib/graphql/generated';

interface TagNode extends Tag {
	children?: TagNode[];
	isExpanded?: boolean;
}

interface TagState {
	tags: TagNode[];
	selectedTags: Set<string>;
	searchQuery: string;
	isLoading: boolean;
	error: string | null;
	recentlyUsedTags: string[];
}

function createTagStore() {
	const initialState: TagState = {
		tags: [],
		selectedTags: new Set(),
		searchQuery: '',
		isLoading: false,
		error: null,
		recentlyUsedTags: []
	};

	const { subscribe, set, update } = writable<TagState>(initialState);

	function buildHierarchy(tags: Tag[]): TagNode[] {
		const tagMap = new Map<string, TagNode>();
		const rootTags: TagNode[] = [];

		tags.forEach((tag) => {
			tagMap.set(tag.id, { ...tag, children: [], isExpanded: false });
		});

		tags.forEach((tag) => {
			const node = tagMap.get(tag.id)!;
			if (tag.parentId) {
				const parent = tagMap.get(tag.parentId);
				if (parent) {
					parent.children = parent.children || [];
					parent.children.push(node);
				}
			} else {
				rootTags.push(node);
			}
		});

		return rootTags;
	}

	return {
		subscribe,

		loadTags: (tags: Tag[]) => {
			update((state) => ({
				...state,
				tags: buildHierarchy(tags),
				isLoading: false,
				error: null
			}));
		},

		selectTag: (tagId: string) => {
			update((state) => {
				const newSelectedTags = new Set(state.selectedTags);
				newSelectedTags.add(tagId);

				const newRecentlyUsed = [
					tagId,
					...state.recentlyUsedTags.filter((id) => id !== tagId)
				].slice(0, 10);

				return {
					...state,
					selectedTags: newSelectedTags,
					recentlyUsedTags: newRecentlyUsed
				};
			});
		},

		deselectTag: (tagId: string) => {
			update((state) => {
				const newSelectedTags = new Set(state.selectedTags);
				newSelectedTags.delete(tagId);

				return {
					...state,
					selectedTags: newSelectedTags
				};
			});
		},

		toggleTag: (tagId: string) => {
			update((state) => {
				const newSelectedTags = new Set(state.selectedTags);

				if (newSelectedTags.has(tagId)) {
					newSelectedTags.delete(tagId);
				} else {
					newSelectedTags.add(tagId);
					const newRecentlyUsed = [
						tagId,
						...state.recentlyUsedTags.filter((id) => id !== tagId)
					].slice(0, 10);

					return {
						...state,
						selectedTags: newSelectedTags,
						recentlyUsedTags: newRecentlyUsed
					};
				}

				return {
					...state,
					selectedTags: newSelectedTags
				};
			});
		},

		clearSelectedTags: () => {
			update((state) => ({
				...state,
				selectedTags: new Set()
			}));
		},

		setSearchQuery: (query: string) => {
			update((state) => ({
				...state,
				searchQuery: query
			}));
		},

		toggleTagExpansion: (tagId: string) => {
			update((state) => {
				function toggleExpansion(tags: TagNode[]): TagNode[] {
					return tags.map((tag) => {
						if (tag.id === tagId) {
							return { ...tag, isExpanded: !tag.isExpanded };
						}
						if (tag.children && tag.children.length > 0) {
							return { ...tag, children: toggleExpansion(tag.children) };
						}
						return tag;
					});
				}

				return {
					...state,
					tags: toggleExpansion(state.tags)
				};
			});
		},

		expandAll: () => {
			update((state) => {
				function expandAll(tags: TagNode[]): TagNode[] {
					return tags.map((tag) => ({
						...tag,
						isExpanded: true,
						children: tag.children ? expandAll(tag.children) : []
					}));
				}

				return {
					...state,
					tags: expandAll(state.tags)
				};
			});
		},

		collapseAll: () => {
			update((state) => {
				function collapseAll(tags: TagNode[]): TagNode[] {
					return tags.map((tag) => ({
						...tag,
						isExpanded: false,
						children: tag.children ? collapseAll(tag.children) : []
					}));
				}

				return {
					...state,
					tags: collapseAll(state.tags)
				};
			});
		},

		createTag: (name: string, parentId?: string, color?: string) => {
			const newTag: TagNode = {
				id: `temp-${Date.now()}`,
				name,
				color: color || '#' + Math.floor(Math.random() * 16777215).toString(16),
				fullPath: name,
				parentId,
				usageCount: 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				children: [],
				isExpanded: false
			};

			update((state) => {
				if (parentId) {
					function addToParent(tags: TagNode[]): TagNode[] {
						return tags.map((tag) => {
							if (tag.id === parentId) {
								return {
									...tag,
									children: [...(tag.children || []), newTag]
								};
							}
							if (tag.children && tag.children.length > 0) {
								return {
									...tag,
									children: addToParent(tag.children)
								};
							}
							return tag;
						});
					}

					return {
						...state,
						tags: addToParent(state.tags)
					};
				} else {
					return {
						...state,
						tags: [...state.tags, newTag]
					};
				}
			});

			return newTag;
		},

		reset: () => {
			set(initialState);
		}
	};
}

export const tagStore = createTagStore();

export const flattenedTags = derived(tagStore, ($store) => {
	const result: TagNode[] = [];

	function traverse(nodes: TagNode[]) {
		nodes.forEach((node) => {
			result.push(node);
			if (node.children && node.children.length > 0) {
				traverse(node.children);
			}
		});
	}

	traverse($store.tags);
	return result;
});

export const filteredTags = derived([tagStore, flattenedTags], ([$store, $flattenedTags]) => {
	if (!$store.searchQuery) return $flattenedTags;

	const query = $store.searchQuery.toLowerCase();
	return $flattenedTags.filter(
		(tag) => tag.name.toLowerCase().includes(query) || tag.fullPath.toLowerCase().includes(query)
	);
});

export const selectedTagsArray = derived([tagStore, flattenedTags], ([$store, $flattenedTags]) => {
	return $flattenedTags.filter((tag) => $store.selectedTags.has(tag.id));
});

export const recentTags = derived([tagStore, flattenedTags], ([$store, $flattenedTags]) => {
	return $store.recentlyUsedTags
		.map((id) => $flattenedTags.find((tag) => tag.id === id))
		.filter(Boolean) as TagNode[];
});
