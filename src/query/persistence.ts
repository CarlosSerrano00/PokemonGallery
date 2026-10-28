import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

import { collectionKeys, pokemonKeys } from '@/query/query-keys';
import {
  PERSIST_BUSTER,
  PERSIST_MAX_AGE,
  PERSIST_STORAGE_KEY,
} from '@/query/policies';
import { logEvent, logWarning } from '@/utils/logger';

const basePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_STORAGE_KEY,
  throttleTime: 1000,
  retry: ({ persistedClient, error, errorCount }) => {
    logWarning('cache:persist:retry', {
      errorCount,
      message: error.message,
    });
    if (errorCount >= 3) {
      logWarning('cache:persist:give-up', { errorCount });
      return undefined;
    }
    // Returning the client retries the write. If the quota is exceeded, the
    // next attempts fail and the persister gives up without blocking the app.
    return persistedClient;
  },
});

/**
 * Thin wrapper that adds verifiable logs around restore/discard without
 * changing the persister contract.
 */
const loggedPersister = {
  persistClient: basePersister.persistClient,
  async restoreClient() {
    logEvent('cache:restore:start', { storageKey: PERSIST_STORAGE_KEY });
    const client = await basePersister.restoreClient();
    logEvent('cache:restore:read', {
      found: Boolean(client),
      savedAt: client ? new Date(client.timestamp).toISOString() : null,
      buster: client?.buster ?? null,
    });
    return client;
  },
  async removeClient() {
    logEvent('cache:restore:discard', {
      reason: 'expired-buster-mismatch-or-unreadable',
    });
    await basePersister.removeClient();
  },
};

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: loggedPersister,
  maxAge: PERSIST_MAX_AGE,
  buster: PERSIST_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      if (query.state.status !== 'success') return false;
      if (query.meta?.persist === false) return false;
      return (
        query.queryKey[0] === pokemonKeys.all[0] ||
        query.queryKey[0] === collectionKeys.all[0]
      );
    },
    // Default TanStack behavior persists paused mutations only. Being explicit
    // avoids persisting already-settled mutation state.
    shouldDehydrateMutation: (mutation) => mutation.state.isPaused,
  },
};
