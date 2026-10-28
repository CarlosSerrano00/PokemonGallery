import { useMutationState } from '@tanstack/react-query';

import { collectionMutationKeys } from '@/query/query-keys';
import { getErrorMessage } from '@/utils/errors';

export type SyncStatus = {
  pausedCount: number;
  activeCount: number;
  errorCount: number;
  lastError: string | null;
  lastErrorAt: number | null;
  lastSuccessAt: number | null;
};

export function useSyncStatus(): SyncStatus {
  const pending = useMutationState({
    filters: { mutationKey: collectionMutationKeys.all, status: 'pending' },
    select: (mutation) => ({
      isPaused: mutation.state.isPaused,
      submittedAt: mutation.state.submittedAt,
    }),
  });

  const errors = useMutationState({
    filters: { mutationKey: collectionMutationKeys.all, status: 'error' },
    select: (mutation) => ({
      message: getErrorMessage(mutation.state.error),
      submittedAt: mutation.state.submittedAt,
    }),
  });

  const successes = useMutationState({
    filters: { mutationKey: collectionMutationKeys.all, status: 'success' },
    select: (mutation) => mutation.state.submittedAt,
  });

  const pausedCount = pending.filter((item) => item.isPaused).length;
  const activeCount = pending.filter((item) => !item.isPaused).length;

  const orderedErrors = [...errors].sort((a, b) => b.submittedAt - a.submittedAt);
  const lastSuccessAt = successes.length > 0 ? Math.max(...successes) : null;

  return {
    pausedCount,
    activeCount,
    errorCount: errors.length,
    lastError: orderedErrors[0]?.message ?? null,
    lastErrorAt: orderedErrors[0]?.submittedAt ?? null,
    lastSuccessAt,
  };
}
