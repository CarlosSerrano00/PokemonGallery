export class ApiError extends Error {
  readonly status?: number;
  readonly url?: string;
  readonly detail?: string;

  constructor(message: string, options?: { status?: number; url?: string; detail?: string; cause?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.url = options?.url;
    this.detail = options?.detail;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'No encontramos ese recurso en la API.';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
