import type { ApiError } from '@/utils/errors';

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = (error as ApiError | undefined)?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 2;
}

export function shouldRetryMutation(failureCount: number, error: unknown): boolean {
  const status = (error as ApiError | undefined)?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function retryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}
