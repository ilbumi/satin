import { gql } from '@urql/svelte';

// Tag data structure based on GraphQL schema
export interface TagData {
	id: string;
	name: string;
	description: string;
	parentId?: string | null;
	path: string;
	depth: number;
	color?: string | null;
	usageCount: number;
	createdAt: string;
	updatedAt: string;
	// Client-side computed field for building hierarchy
	children?: TagData[];
}

// Input types for mutations
export interface TagCreateInput {
	name: string;
	description?: string;
	parentId?: string | null;
	color?: string | null;
}

export interface TagUpdateInput {
	name?: string;
	description?: string;
	parentId?: string | null;
	color?: string | null;
}

// Get all tags
export const GET_TAGS = gql`
	query GetTags {
		tags {
			id
			name
			description
			parentId
			path
			depth
			color
			usageCount
			createdAt
			updatedAt
		}
	}
`;

export interface GetTagsQuery {
	tags: TagData[];
}

// Get tag tree (flat list ordered by hierarchy)
export const GET_TAG_TREE = gql`
	query GetTagTree($rootId: String) {
		tagTree(rootId: $rootId) {
			id
			name
			description
			parentId
			path
			depth
			color
			usageCount
			createdAt
			updatedAt
		}
	}
`;

export interface GetTagTreeQuery {
	tagTree: TagData[];
}

export interface GetTagTreeVariables {
	rootId?: string | null;
}

// Helper function to build tree structure from flat list
export function buildTagTree(flatTags: TagData[]): TagData[] {
	// Create a map for quick lookups
	const tagMap = new Map<string, TagData>();
	const rootTags: TagData[] = [];

	// First pass: create map and initialize children arrays
	for (const tag of flatTags) {
		tagMap.set(tag.id, { ...tag, children: [] });
	}

	// Second pass: build tree structure
	for (const tag of flatTags) {
		const tagWithChildren = tagMap.get(tag.id)!;

		if (tag.parentId && tagMap.has(tag.parentId)) {
			// Add to parent's children
			const parent = tagMap.get(tag.parentId)!;
			parent.children!.push(tagWithChildren);
		} else {
			// This is a root tag
			rootTags.push(tagWithChildren);
		}
	}

	return rootTags;
}

// Mutation definitions
export const CREATE_TAG = gql`
	mutation CreateTag($input: TagCreateInput!) {
		createTag(input: $input) {
			id
			name
			description
			color
			path
			parentId
			depth
			usageCount
			createdAt
			updatedAt
		}
	}
`;

export interface CreateTagMutation {
	createTag: TagData;
}

export interface CreateTagVariables {
	input: TagCreateInput;
}

export const UPDATE_TAG = gql`
	mutation UpdateTag($id: String!, $input: TagUpdateInput!) {
		updateTag(id: $id, input: $input) {
			id
			name
			description
			color
			path
			parentId
			depth
			usageCount
			createdAt
			updatedAt
		}
	}
`;

export interface UpdateTagMutation {
	updateTag: TagData | null;
}

export interface UpdateTagVariables {
	id: string;
	input: TagUpdateInput;
}

export const DELETE_TAG = gql`
	mutation DeleteTag($id: String!) {
		deleteTag(id: $id)
	}
`;

export interface DeleteTagMutation {
	deleteTag: number;
}

export interface DeleteTagVariables {
	id: string;
}

export const MOVE_TAG = gql`
	mutation MoveTag($tagId: String!, $newParentId: String) {
		moveTag(tagId: $tagId, newParentId: $newParentId) {
			id
			name
			description
			color
			path
			parentId
			depth
			usageCount
			createdAt
			updatedAt
		}
	}
`;

export interface MoveTagMutation {
	moveTag: TagData | null;
}

export interface MoveTagVariables {
	tagId: string;
	newParentId?: string | null;
}
