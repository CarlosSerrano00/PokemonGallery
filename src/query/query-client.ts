import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { MOCKAPI_POKEMON_ENDPOINT } from '@/utils/env';
import { getErrorMessage } from '@/utils/errors';
import { logEvent, logWarning } from '@/utils/logger';
import { registerCollectionMutationDefaults } from '@/query/mutation-defaults';
import {
  MOCKAPI_GC_TIME,
  MOCKAPI_STALE_TIME,
  POKEAPI_GC_TIME,
  POKEAPI_STALE_TIME,
} from '@/query/policies';
import { collectionKeys, pokemonKeys } from '@/query/query-keys';
import { retryDelay, shouldRetryMutation, shouldRetryQuery } from '@/query/retry';

const loggedPausedMutations = new Set<number>();

function createQueryClient(): QueryClient {
  const mutationCache = new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      logEvent('mutation:success', {
        mutationId: mutation.mutationId,
        mutationKey: mutation.options.mutationKey ?? null,
      });
    },
    onError: (error, _variables, _context, mutation) => {
      logEvent('mutation:error', {
        mutationId: mutation.mutationId,
        mutationKey: mutation.options.mutationKey ?? null,
        message: getErrorMessage(error),
      });
    },
  });

  mutationCache.subscribe((event) => {
    if (!('mutation' in event) || !event.mutation) return;
    const mutation = event.mutation;

    if (mutation.state.status !== 'pending') {
      loggedPausedMutations.delete(mutation.mutationId);
      return;
    }

    if (mutation.state.isPaused && !loggedPausedMutations.has(mutation.mutationId)) {
      loggedPausedMutations.add(mutation.mutationId);
      logEvent('mutation:paused', {
        mutationId: mutation.mutationId,
        mutationKey: mutation.options.mutationKey ?? null,
      });
    }

    if (!mutation.state.isPaused) {
      loggedPausedMutations.delete(mutation.mutationId);
    }
  });

  const client = new QueryClient({
    queryCache: new QueryCache({
      onSuccess: (_data, query) => {
        const source = query.queryKey[0] === pokemonKeys.all[0] ? 'pokeapi' : 'mockapi';
        logEvent('query:success', {
          source,
          queryKey: query.queryKey,
          cached: query.state.dataUpdateCount > 1,
        });
      },
      onError: (error, query) => {
        const source = query.queryKey[0] === pokemonKeys.all[0] ? 'pokeapi' : 'mockapi';
        logWarning('query:error', {
          source,
          queryKey: query.queryKey,
          message: getErrorMessage(error),
        });
      },
    }),
    mutationCache,
    defaultOptions: {
      queries: {
        networkMode: 'online',
        retry: shouldRetryQuery,
        retryDelay,
        refetchOnReconnect: true,
        // React Native has no browser window focus. Reconnection and mount are
        // the meaningful triggers for this app.
        refetchOnWindowFocus: false,
      },
      mutations: {
        networkMode: 'online',
        retry: shouldRetryMutation,
        retryDelay,
      },
    },
  });

  // Per-source policies keep PokéAPI data fresh longer while allowing the
  // personal collection to refresh more often.
  client.setQueryDefaults(pokemonKeys.all, {
    staleTime: POKEAPI_STALE_TIME,
    gcTime: POKEAPI_GC_TIME,
    meta: { source: 'pokeapi', persist: true },
  });

  client.setQueryDefaults(collectionKeys.all, {
    staleTime: MOCKAPI_STALE_TIME,
    gcTime: MOCKAPI_GC_TIME,
    meta: { source: 'mockapi', persist: true },
  });

  registerCollectionMutationDefaults(client);

  logEvent('query-client:init', {
    pokeapiStaleMinutes: POKEAPI_STALE_TIME / 60000,
    pokeapiGcHours: POKEAPI_GC_TIME / 3600000,
    mockapiStaleMinutes: MOCKAPI_STALE_TIME / 60000,
    mockapiGcHours: MOCKAPI_GC_TIME / 3600000,
    collectionEndpoint: MOCKAPI_POKEMON_ENDPOINT,
  });

  return client;
}

/** Single QueryClient for the entire app. */
export const queryClient = createQueryClient();
