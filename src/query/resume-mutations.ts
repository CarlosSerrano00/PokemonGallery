import type { QueryClient } from '@tanstack/react-query';

import { waitForInitialConnectivity } from '@/query/network';
import { collectionMutationKeys } from '@/query/query-keys';
import { logEvent } from '@/utils/logger';

let resumePromise: Promise<void> | null = null;

/**
 * Resumes paused collection mutations after the persisted cache has been
 * restored. A module-level promise prevents concurrent resume loops.
 */
export function resumePausedMutations(client: QueryClient): Promise<void> {
  if (resumePromise) return resumePromise;

  resumePromise = (async () => {
    const initialPaused = client
      .getMutationCache()
      .findAll({ mutationKey: collectionMutationKeys.all, status: 'pending' })
      .filter((mutation) => mutation.state.isPaused);

    if (initialPaused.length === 0) {
      return;
    }

    logEvent('mutations:resume:waiting', {
      paused: initialPaused.length,
    });

    // Never resume against an unverified connection. A failed attempt would
    // surface an error and roll back the optimistic record even though the
    // device was simply offline. TanStack Query will retry automatically when
    // `onlineManager` reports a reconnection.
    const connectivity = await waitForInitialConnectivity(3000);

    const paused = client
      .getMutationCache()
      .findAll({ mutationKey: collectionMutationKeys.all, status: 'pending' })
      .filter((mutation) => mutation.state.isPaused);

    if (paused.length === 0) {
      logEvent('mutations:resume:skipped', {
        reason: 'already-resumed-or-none-paused',
      });
      return;
    }

    if (connectivity.checkedAt === null || !connectivity.isOnline) {
      logEvent('mutations:resume:deferred', {
        paused: paused.length,
        reason: connectivity.checkedAt === null ? 'connectivity-unknown' : 'offline',
      });
      return;
    }

    logEvent('mutations:resume:start', { paused: paused.length });

    try {
      await client.resumePausedMutations();
      logEvent('mutations:resume:finished', { paused: paused.length });
    } catch (error) {
      logEvent('mutations:resume:error', {
        paused: paused.length,
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
  })().finally(() => {
    resumePromise = null;
  });

  return resumePromise;
}
