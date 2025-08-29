import type { ValidationError, NotFoundError, OperationError } from '../graphql/generated';

export type GraphQLError = ValidationError | NotFoundError | OperationError;

export type { ValidationError, NotFoundError, OperationError };
