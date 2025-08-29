import type {
	MlJob,
	MlJobConnection,
	MlJobCreateInput,
	MlJobFilterInput,
	MlJobStatus,
	CreateMlJobResult,
	UpdateMlJobResult,
	PaginationInput,
	SortInput
} from '../generated';

// Re-export types with more descriptive names for legacy compatibility
export type MLJobData = MlJob;

// Query result types
export interface GetMLJobsQuery {
	mlJobs: MlJobConnection;
}

export interface GetMLJobQuery {
	mlJob: MlJob | null;
}

export interface GetMLJobsByImageUrlQuery {
	mlJobsByImageUrl: MlJob[];
}

export interface GetMLJobsByStatusQuery {
	mlJobsByStatus: MlJob[];
}

// Mutation result types
export interface CreateMLJobMutation {
	createMlJob: CreateMlJobResult;
}

export interface UpdateMLJobStatusMutation {
	updateMlJobStatus: UpdateMlJobResult;
}

export interface CancelMLJobMutation {
	cancelMlJob: UpdateMlJobResult;
}

// Re-export input types and enums
export type { MlJobCreateInput, MlJobFilterInput, MlJobStatus, PaginationInput, SortInput };
