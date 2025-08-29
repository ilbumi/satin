import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Annotation = {
  __typename?: 'Annotation';
  boundingBox: BoundingBox;
  confidence?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['String']['output'];
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  imageId: Scalars['String']['output'];
  source: Scalars['String']['output'];
  tags: Array<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type AnnotationConnection = {
  __typename?: 'AnnotationConnection';
  items: Array<Annotation>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AnnotationCreateInput = {
  boundingBox: BoundingBoxInput;
  confidence?: InputMaybe<Scalars['Float']['input']>;
  description?: Scalars['String']['input'];
  imageId: Scalars['String']['input'];
  tags?: Array<Scalars['String']['input']>;
};

export type AnnotationFilterInput = {
  confidenceMax?: InputMaybe<Scalars['Float']['input']>;
  confidenceMin?: InputMaybe<Scalars['Float']['input']>;
  hasTags?: InputMaybe<Array<Scalars['String']['input']>>;
  imageId?: InputMaybe<Scalars['String']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
};

export type AnnotationSuccessResult = {
  __typename?: 'AnnotationSuccessResult';
  data: Annotation;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type AnnotationUpdateInput = {
  boundingBox?: InputMaybe<BoundingBoxInput>;
  confidence?: InputMaybe<Scalars['Float']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type AnnotationUpdateWithId = {
  id: Scalars['String']['input'];
  input: AnnotationUpdateInput;
};

export type BoundingBox = {
  __typename?: 'BoundingBox';
  height: Scalars['Float']['output'];
  width: Scalars['Float']['output'];
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type BoundingBoxInput = {
  height: Scalars['Float']['input'];
  width: Scalars['Float']['input'];
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};

export type BulkAnnotationSaveInput = {
  create?: Array<AnnotationCreateInput>;
  delete?: Array<Scalars['String']['input']>;
  imageId: Scalars['String']['input'];
  update?: Array<AnnotationUpdateWithId>;
};

export type BulkAnnotationSaveResult = {
  __typename?: 'BulkAnnotationSaveResult';
  created: Array<Annotation>;
  deleted: Array<Scalars['String']['output']>;
  updated: Array<Annotation>;
};

export type CreateAnnotationResult = AnnotationSuccessResult | NotFoundError | OperationError | ValidationError;

export type CreateImageResult = ImageSuccessResult | OperationError | ValidationError;

export type CreateMlJobResult = MlJobSuccessResult | OperationError | ValidationError;

export type DeleteResult = {
  __typename?: 'DeleteResult';
  deleted: Scalars['Boolean']['output'];
  message: Scalars['String']['output'];
};

export type Image = {
  __typename?: 'Image';
  createdAt: Scalars['String']['output'];
  ext?: Maybe<Scalars['String']['output']>;
  height?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  status: ImageStatus;
  updatedAt: Scalars['String']['output'];
  url: Scalars['String']['output'];
  width?: Maybe<Scalars['Int']['output']>;
};

export type ImageConnection = {
  __typename?: 'ImageConnection';
  items: Array<Image>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ImageCreateInput = {
  url: Scalars['String']['input'];
};

export type ImageFilterInput = {
  status?: InputMaybe<ImageStatus>;
  statuses?: InputMaybe<Array<ImageStatus>>;
  urlContains?: InputMaybe<Scalars['String']['input']>;
};

export type ImageStatus =
  | 'ANNOTATED'
  | 'NEEDS_REANNOTATION'
  | 'NEW';

export type ImageSuccessResult = {
  __typename?: 'ImageSuccessResult';
  data: Image;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ImageUpdateInput = {
  status?: InputMaybe<ImageStatus>;
};

export type MlJob = {
  __typename?: 'MLJob';
  createdAt: Scalars['String']['output'];
  endpoint: Scalars['String']['output'];
  errorMessage?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  imageUrl: Scalars['String']['output'];
  predictions: Array<Annotation>;
  status: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type MlJobConnection = {
  __typename?: 'MLJobConnection';
  items: Array<MlJob>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type MlJobCreateInput = {
  endpoint: Scalars['String']['input'];
  imageUrl: Scalars['String']['input'];
};

export type MlJobFilterInput = {
  endpoint?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<MlJobStatus>;
};

export type MlJobStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING'
  | 'RUNNING';

export type MlJobSuccessResult = {
  __typename?: 'MLJobSuccessResult';
  data: MlJob;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  bulkSaveAnnotations: BulkAnnotationSaveResult;
  cancelMlJob: UpdateMlJobResult;
  createAnnotation: CreateAnnotationResult;
  createImage: CreateImageResult;
  createMlJob: CreateMlJobResult;
  deleteAnnotation: DeleteResult;
  deleteImage: DeleteResult;
  updateAnnotation: UpdateAnnotationResult;
  updateImage: UpdateImageResult;
  updateMlJobStatus: UpdateMlJobResult;
};


export type MutationBulkSaveAnnotationsArgs = {
  input: BulkAnnotationSaveInput;
};


export type MutationCancelMlJobArgs = {
  id: Scalars['String']['input'];
};


export type MutationCreateAnnotationArgs = {
  input: AnnotationCreateInput;
};


export type MutationCreateImageArgs = {
  input: ImageCreateInput;
};


export type MutationCreateMlJobArgs = {
  input: MlJobCreateInput;
};


export type MutationDeleteAnnotationArgs = {
  id: Scalars['String']['input'];
};


export type MutationDeleteImageArgs = {
  id: Scalars['String']['input'];
};


export type MutationUpdateAnnotationArgs = {
  id: Scalars['String']['input'];
  input: AnnotationUpdateInput;
};


export type MutationUpdateImageArgs = {
  id: Scalars['String']['input'];
  input: ImageUpdateInput;
};


export type MutationUpdateMlJobStatusArgs = {
  errorMessage?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  status: Scalars['String']['input'];
};

export type NotFoundError = {
  __typename?: 'NotFoundError';
  id: Scalars['String']['output'];
  message: Scalars['String']['output'];
  resource: Scalars['String']['output'];
};

export type OperationError = {
  __typename?: 'OperationError';
  details?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
  totalCount: Scalars['Int']['output'];
};

export type PaginationInput = {
  /** Number of items to return */
  limit?: Scalars['Int']['input'];
  /** Number of items to skip */
  offset?: Scalars['Int']['input'];
};

export type Query = {
  __typename?: 'Query';
  annotation?: Maybe<Annotation>;
  annotations: AnnotationConnection;
  annotationsByImage: Array<Annotation>;
  image?: Maybe<Image>;
  images: ImageConnection;
  imagesByStatus: Array<Image>;
  mlJob?: Maybe<MlJob>;
  mlJobs: MlJobConnection;
  mlJobsByImageUrl: Array<MlJob>;
  mlJobsByStatus: Array<MlJob>;
};


export type QueryAnnotationArgs = {
  id: Scalars['String']['input'];
};


export type QueryAnnotationsArgs = {
  filter?: InputMaybe<AnnotationFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};


export type QueryAnnotationsByImageArgs = {
  imageId: Scalars['String']['input'];
};


export type QueryImageArgs = {
  id: Scalars['String']['input'];
};


export type QueryImagesArgs = {
  filter?: InputMaybe<ImageFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};


export type QueryImagesByStatusArgs = {
  statuses: Array<Scalars['String']['input']>;
};


export type QueryMlJobArgs = {
  id: Scalars['String']['input'];
};


export type QueryMlJobsArgs = {
  filter?: InputMaybe<MlJobFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
};


export type QueryMlJobsByImageUrlArgs = {
  imageUrl: Scalars['String']['input'];
};


export type QueryMlJobsByStatusArgs = {
  status: Scalars['String']['input'];
};

export type SortInput = {
  /** Field to sort by */
  field: Scalars['String']['input'];
  /** Sort order */
  order?: SortOrder;
};

export type SortOrder =
  | 'ASC'
  | 'DESC';

export type UpdateAnnotationResult = AnnotationSuccessResult | NotFoundError | OperationError | ValidationError;

export type UpdateImageResult = ImageSuccessResult | NotFoundError | OperationError | ValidationError;

export type UpdateMlJobResult = MlJobSuccessResult | NotFoundError | OperationError | ValidationError;

export type ValidationError = {
  __typename?: 'ValidationError';
  field: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type CreateAnnotationMutationVariables = Exact<{
  input: AnnotationCreateInput;
}>;


export type CreateAnnotationMutation = { __typename?: 'Mutation', createAnnotation: { __typename?: 'AnnotationSuccessResult', success: boolean, message: string, data: { __typename?: 'Annotation', id: string, imageId: string, description: string, tags: Array<string>, confidence?: number | null, source: string, createdAt: string, updatedAt: string, boundingBox: { __typename?: 'BoundingBox', x: number, y: number, width: number, height: number } } } | { __typename?: 'NotFoundError' } | { __typename?: 'OperationError', message: string, details?: string | null } | { __typename?: 'ValidationError', field: string, message: string } };

export type UpdateAnnotationMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: AnnotationUpdateInput;
}>;


export type UpdateAnnotationMutation = { __typename?: 'Mutation', updateAnnotation: { __typename?: 'AnnotationSuccessResult', success: boolean, message: string, data: { __typename?: 'Annotation', id: string, imageId: string, description: string, tags: Array<string>, confidence?: number | null, source: string, createdAt: string, updatedAt: string, boundingBox: { __typename?: 'BoundingBox', x: number, y: number, width: number, height: number } } } | { __typename?: 'NotFoundError', id: string, resource: string, message: string } | { __typename?: 'OperationError', message: string, details?: string | null } | { __typename?: 'ValidationError', field: string, message: string } };

export type DeleteAnnotationMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteAnnotationMutation = { __typename?: 'Mutation', deleteAnnotation: { __typename?: 'DeleteResult', deleted: boolean, message: string } };

export type BulkSaveAnnotationsMutationVariables = Exact<{
  input: BulkAnnotationSaveInput;
}>;


export type BulkSaveAnnotationsMutation = { __typename?: 'Mutation', bulkSaveAnnotations: { __typename?: 'BulkAnnotationSaveResult', deleted: Array<string>, created: Array<{ __typename?: 'Annotation', id: string, imageId: string, description: string, tags: Array<string>, confidence?: number | null, source: string, createdAt: string, updatedAt: string, boundingBox: { __typename?: 'BoundingBox', x: number, y: number, width: number, height: number } }>, updated: Array<{ __typename?: 'Annotation', id: string, imageId: string, description: string, tags: Array<string>, confidence?: number | null, source: string, createdAt: string, updatedAt: string, boundingBox: { __typename?: 'BoundingBox', x: number, y: number, width: number, height: number } }> } };

export type CreateImageMutationVariables = Exact<{
  input: ImageCreateInput;
}>;


export type CreateImageMutation = { __typename?: 'Mutation', createImage: { __typename?: 'ImageSuccessResult', success: boolean, message: string, data: { __typename?: 'Image', id: string, url: string, status: ImageStatus, createdAt: string, updatedAt: string } } | { __typename?: 'OperationError', message: string, details?: string | null } | { __typename?: 'ValidationError', field: string, message: string } };

export type UpdateImageMutationVariables = Exact<{
  id: Scalars['String']['input'];
  input: ImageUpdateInput;
}>;


export type UpdateImageMutation = { __typename?: 'Mutation', updateImage: { __typename?: 'ImageSuccessResult', success: boolean, message: string, data: { __typename?: 'Image', id: string, url: string, status: ImageStatus, createdAt: string, updatedAt: string } } | { __typename?: 'NotFoundError', id: string, resource: string, message: string } | { __typename?: 'OperationError', message: string, details?: string | null } | { __typename?: 'ValidationError', field: string, message: string } };

export type DeleteImageMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteImageMutation = { __typename?: 'Mutation', deleteImage: { __typename?: 'DeleteResult', deleted: boolean, message: string } };

export type GetAnnotationsByImageQueryVariables = Exact<{
  imageId: Scalars['String']['input'];
}>;


export type GetAnnotationsByImageQuery = { __typename?: 'Query', annotationsByImage: Array<{ __typename?: 'Annotation', id: string, imageId: string, description: string, tags: Array<string>, confidence?: number | null, source: string, createdAt: string, updatedAt: string, boundingBox: { __typename?: 'BoundingBox', x: number, y: number, width: number, height: number } }> };

export type GetAnnotationQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetAnnotationQuery = { __typename?: 'Query', annotation?: { __typename?: 'Annotation', id: string, imageId: string, description: string, tags: Array<string>, confidence?: number | null, source: string, createdAt: string, updatedAt: string, boundingBox: { __typename?: 'BoundingBox', x: number, y: number, width: number, height: number } } | null };

export type GetImagesQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SortInput>;
}>;


export type GetImagesQuery = { __typename?: 'Query', images: { __typename?: 'ImageConnection', totalCount: number, items: Array<{ __typename?: 'Image', id: string, url: string, status: ImageStatus, createdAt: string, updatedAt: string }>, pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, hasPreviousPage: boolean, startCursor?: string | null, endCursor?: string | null } } };

export type GetImageQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetImageQuery = { __typename?: 'Query', image?: { __typename?: 'Image', id: string, url: string, status: ImageStatus, createdAt: string, updatedAt: string } | null };

export type GetImagesByStatusQueryVariables = Exact<{
  statuses: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type GetImagesByStatusQuery = { __typename?: 'Query', imagesByStatus: Array<{ __typename?: 'Image', id: string, url: string, status: ImageStatus, createdAt: string, updatedAt: string }> };


export const CreateAnnotationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAnnotation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AnnotationCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAnnotation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AnnotationSuccessResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"boundingBox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ValidationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"details"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAnnotationMutation, CreateAnnotationMutationVariables>;
export const UpdateAnnotationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAnnotation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AnnotationUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAnnotation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AnnotationSuccessResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"boundingBox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ValidationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"details"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotFoundError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAnnotationMutation, UpdateAnnotationMutationVariables>;
export const DeleteAnnotationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAnnotation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAnnotation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<DeleteAnnotationMutation, DeleteAnnotationMutationVariables>;
export const BulkSaveAnnotationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"BulkSaveAnnotations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BulkAnnotationSaveInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkSaveAnnotations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"created"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"boundingBox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"boundingBox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deleted"}}]}}]}}]} as unknown as DocumentNode<BulkSaveAnnotationsMutation, BulkSaveAnnotationsMutationVariables>;
export const CreateImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ImageCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageSuccessResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ValidationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"details"}}]}}]}}]}}]} as unknown as DocumentNode<CreateImageMutation, CreateImageMutationVariables>;
export const UpdateImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ImageUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageSuccessResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ValidationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OperationError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"details"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotFoundError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resource"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateImageMutation, UpdateImageMutationVariables>;
export const DeleteImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleted"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<DeleteImageMutation, DeleteImageMutationVariables>;
export const GetAnnotationsByImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAnnotationsByImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"annotationsByImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"imageId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"boundingBox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetAnnotationsByImageQuery, GetAnnotationsByImageQueryVariables>;
export const GetAnnotationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAnnotation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"annotation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"confidence"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"boundingBox"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetAnnotationQuery, GetAnnotationQueryVariables>;
export const GetImagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetImages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SortInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"images"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"hasPreviousPage"}},{"kind":"Field","name":{"kind":"Name","value":"startCursor"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<GetImagesQuery, GetImagesQueryVariables>;
export const GetImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"image"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetImageQuery, GetImageQueryVariables>;
export const GetImagesByStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetImagesByStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imagesByStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"statuses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetImagesByStatusQuery, GetImagesByStatusQueryVariables>;
