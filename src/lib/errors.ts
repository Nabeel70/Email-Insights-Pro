
// ============================================================================
// CUSTOM ERROR FRAMEWORK (A TAXONOMY OF FAILURE)
// ============================================================================
import type { ZodIssue } from 'zod';

type ErrorContext = Record<string, unknown>;

export class BaseError extends Error {
  public readonly context?: ErrorContext;
  constructor(message: string, options: { cause?: Error, context?: ErrorContext } = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.context = options.context;
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, issues: ZodIssue[]) {
    super(message, { context: { issues } });
  }
}

export class NetworkError extends BaseError {
  constructor(cause: Error) {
    super('A network error occurred. Please check your connection.', { cause });
  }
}

export class ApiError extends BaseError {
  public readonly statusCode: number;
  public readonly response: Response;
  constructor(message: string, response: Response) {
    super(message, { context: { status: response.status, statusText: response.statusText } });
    this.statusCode = response.status;
    this.response = response;
  }
}

export class UnexpectedResponseError extends BaseError {
  public readonly contentType: string | null;
  constructor(message: string, contentType: string | null) {
    super(message, { context: { contentType } });
    this.contentType = contentType;
  }
}
