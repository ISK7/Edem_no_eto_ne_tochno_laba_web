export type FieldErrors = Record<string, string>;

export class AppError extends Error {
  readonly status: number;
  readonly fields?: FieldErrors;
  readonly code?: string;

  constructor(status: number, message: string, fields?: FieldErrors, code?: string) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
