import type {
	Annotation,
	BoundingBox,
	AnnotationCreateInput,
	AnnotationUpdateInput,
	BoundingBoxInput,
	CreateAnnotationResult,
	UpdateAnnotationResult,
	DeleteResult
} from '../generated';

// Import generated GraphQL documents
import {
	GetAnnotationsByImageDocument,
	GetAnnotationDocument,
	CreateAnnotationDocument,
	UpdateAnnotationDocument,
	DeleteAnnotationDocument,
	BulkSaveAnnotationsDocument
} from '../generated';

// Export GraphQL documents
export const GET_ANNOTATIONS_BY_IMAGE = GetAnnotationsByImageDocument;
export const GET_ANNOTATION = GetAnnotationDocument;
export const CREATE_ANNOTATION = CreateAnnotationDocument;
export const UPDATE_ANNOTATION = UpdateAnnotationDocument;
export const DELETE_ANNOTATION = DeleteAnnotationDocument;
export const BULK_SAVE_ANNOTATIONS = BulkSaveAnnotationsDocument;

// Re-export types with more descriptive names for legacy compatibility
export type AnnotationData = Annotation;
export type BoundingBoxData = BoundingBox;

// Query result types
export interface GetAnnotationsByImageQuery {
	annotationsByImage: Annotation[];
}

export interface GetAnnotationQuery {
	annotation: Annotation | null;
}

// Mutation result types
export interface CreateAnnotationMutation {
	createAnnotation: CreateAnnotationResult;
}

export interface UpdateAnnotationMutation {
	updateAnnotation: UpdateAnnotationResult;
}

export interface DeleteAnnotationMutation {
	deleteAnnotation: DeleteResult;
}

// Re-export input types
export type { AnnotationCreateInput, AnnotationUpdateInput, BoundingBoxInput };
