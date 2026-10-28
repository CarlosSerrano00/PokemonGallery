import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, type PropsWithChildren } from 'react';

import { startConnectivityMonitoring, useNetworkStatus } from '@/query/network';
import { persistOptions } from '@/query/persistence';
import { queryClient } from '@/query/query-client';
import { collectionMutationKeys } from '@/query/query-keys';
import { flushCollectionOutbox, restoreCollectionOutbox } from '@/query/collection-outbox';
import { resumePausedMutations } from '@/query/resume-mutations';
import { logEvent, logWarning } from '@/utils/logger';

let outboxRestorePromise: Promise<boolean> | null = null;

function restoreAndFlushOutbox(): void {
  if (!outboxRestorePromise) {
    outboxRestorePromise = restoreCollectionOutbox(queryClient)
      .then(() => true)
      .catch((error: unknown) => {
        outboxRestorePromise = null;
        logWarning('outbox:restore:error', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        return false;
      });
  }

  void outboxRestorePromise
    .then((restored) => {
      if (restored) return flushCollectionOutbox(queryClient);
    })
    .catch((error: unknown) => {
      logWarning('outbox:flush:error', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    });
}

function ConnectivityBootstrap() {
  const { isOnline, checkedAt } = useNetworkStatus();

  useEffect(() => startConnectivityMonitoring(), []);

  // Covers the case where the first probe finishes after the restore-time
  // resume already gave up, and every later reconnection/foreground probe.
  // `resumePausedMutations` is guarded and returns immediately when nothing is
  // paused.
  useEffect(() => {
    if (checkedAt !== null && isOnline) {
      restoreAndFlushOutbox();
      void resumePausedMutations(queryClient);
    }
  }, [checkedAt, isOnline]);

  return null;
}

function handleRestoreSuccess() {
  const queries = queryClient.getQueryCache().getAll().length;
  const paused = queryClient
    .getMutationCache()
    .findAll({ mutationKey: collectionMutationKeys.all, status: 'pending' })
    .filter((mutation) => mutation.state.isPaused).length;

  logEvent('cache:restore:success', { queries, pausedMutations: paused });

  restoreAndFlushOutbox();
  // Fire-and-forget: hydration must not wait for network work, otherwise the
  // whole UI would stay blocked when the device is offline.
  void resumePausedMutations(queryClient);
}

function handleRestoreError() {
  logWarning('cache:restore:error', {
    fallback: 'continue-with-empty-cache',
  });
}

export function AppQueryProvider({ children }: PropsWithChildren) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={handleRestoreSuccess}
      onError={handleRestoreError}>
      <ConnectivityBootstrap />
      {children}
    </PersistQueryClientProvider>
  );
}
