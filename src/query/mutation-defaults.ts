import type { QueryClient } from '@tanstack/react-query';

import { createCollection, updateCollection } from '@/api/mockapi';
import { collectionKeys, collectionMutationKeys } from '@/query/query-keys';
import type {
  CollectionViewRecord,
  CreateCollectionInput,
  CreateCollectionVariables,
  PokemonCollectionRecord,
  UpdateCollectionInput,
  UpdateCollectionVariables,
} from '@/types/collection';
import { logEvent } from '@/utils/logger';

function updateCollectionLists(
  queryClient: QueryClient,
  updater: (records: CollectionViewRecord[]) => CollectionViewRecord[],
): void {
  const cachedLists = queryClient.getQueryCache().findAll({
    queryKey: collectionKeys.lists(),
  });

  if (cachedLists.length === 0) {
    const current =
      queryClient.getQueryData<CollectionViewRecord[]>(collectionKeys.list()) ?? [];
    queryClient.setQueryData(collectionKeys.list(), updater(current));
    return;
  }

  queryClient.setQueriesData<CollectionViewRecord[]>(
    { queryKey: collectionKeys.lists() },
    (current) => updater(current ?? []),
  );
}

function makeOptimisticRecord(
  input: CreateCollectionInput,
  optimisticId: string,
): CollectionViewRecord {
  return {
    ...input,
    id: optimisticId,
    __optimistic: true,
    __optimisticId: optimisticId,
  };
}

function replaceRecord(
  records: CollectionViewRecord[],
  record: PokemonCollectionRecord,
  optimisticId?: string,
): CollectionViewRecord[] {
  const withoutTemporary = records.filter(
    (item) =>
      item.id !== optimisticId &&
      (!optimisticId || item.__optimisticId !== optimisticId) &&
      item.id !== record.id,
  );
  return [{ ...record }, ...withoutTemporary];
}

function patchRecord(
  records: CollectionViewRecord[],
  id: string,
  input: UpdateCollectionInput,
): CollectionViewRecord[] {
  return records.map((record) =>
    record.id === id
      ? { ...record, ...input, __optimistic: true }
      : record,
  );
}

function removeTemporaryRecord(
  records: CollectionViewRecord[],
  optimisticId: string,
): CollectionViewRecord[] {
  return records.filter(
    (record) => record.id !== optimisticId && record.__optimisticId !== optimisticId,
  );
}

/**
 * Mutation defaults are registered on the QueryClient (not only in hooks) so
 * that paused mutations restored from AsyncStorage can resume with a
 * mutationFn and the same cache reconciliation logic. Hooks only add UI-level
 * callbacks through `mutate`/`mutateAsync`.
 */
export function registerCollectionMutationDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(collectionMutationKeys.create, {
    mutationFn: (variables: CreateCollectionVariables) => createCollection(variables.input),
    networkMode: 'online',
    retry: 0,
    onMutate: async (variables: CreateCollectionVariables) => {
      await queryClient.cancelQueries({ queryKey: collectionKeys.all });

      const optimisticRecord = makeOptimisticRecord(variables.input, variables.optimisticId);
      updateCollectionLists(queryClient, (records) => [
        optimisticRecord,
        ...records.filter((record) => record.id !== optimisticRecord.id),
      ]);

      logEvent('mutation:create:optimistic', {
        optimisticId: variables.optimisticId,
        pokemonId: variables.input.pokemonId,
      });
    },
    onSuccess: (record, variables: CreateCollectionVariables) => {
      updateCollectionLists(queryClient, (records) =>
        replaceRecord(records, record, variables.optimisticId),
      );
      queryClient.setQueryData(collectionKeys.detail(record.id), record);

      logEvent('collection:cache:reconciled', {
        operation: 'create',
        id: record.id,
        pokemonId: record.pokemonId,
      });
    },
    onError: (_error, variables: CreateCollectionVariables) => {
      updateCollectionLists(queryClient, (records) =>
        removeTemporaryRecord(records, variables.optimisticId),
      );

      logEvent('mutation:create:rollback', {
        optimisticId: variables.optimisticId,
      });
    },
    onSettled: () => {
      logEvent('collection:invalidate', {
        operation: 'create',
        queryKey: collectionKeys.lists(),
      });
      void queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
    },
  });

  queryClient.setMutationDefaults(collectionMutationKeys.update, {
    mutationFn: (variables: UpdateCollectionVariables) =>
      updateCollection(variables.id, variables.input),
    networkMode: 'online',
    retry: 1,
    onMutate: async (variables: UpdateCollectionVariables) => {
      await queryClient.cancelQueries({ queryKey: collectionKeys.all });

      queryClient.setQueriesData<CollectionViewRecord[]>(
        { queryKey: collectionKeys.lists() },
        (current) => patchRecord(current ?? [], variables.id, variables.input),
      );

      const detail = queryClient.getQueryData<CollectionViewRecord>(
        collectionKeys.detail(variables.id),
      );
      if (detail) {
        queryClient.setQueryData(collectionKeys.detail(variables.id), {
          ...detail,
          ...variables.input,
          __optimistic: true,
        });
      }

      logEvent('mutation:update:optimistic', {
        id: variables.id,
        pokemonId: variables.input.pokemonId,
      });
    },
    onSuccess: (record, variables: UpdateCollectionVariables) => {
      queryClient.setQueriesData<CollectionViewRecord[]>(
        { queryKey: collectionKeys.lists() },
        (current) =>
          (current ?? []).map((item) =>
            item.id === variables.id ? { ...record } : item,
          ),
      );
      queryClient.setQueryData(collectionKeys.detail(record.id), record);

      logEvent('collection:cache:reconciled', {
        operation: 'update',
        id: record.id,
      });
    },
    onError: (_error, variables: UpdateCollectionVariables) => {
      // The server remains the source of truth after a failed update. Marking
      // both branches stale reconciles list and detail without inventing data.
      logEvent('mutation:update:reconcile', { id: variables.id });
    },
    onSettled: (_data, _error, variables: UpdateCollectionVariables) => {
      logEvent('collection:invalidate', {
        operation: 'update',
        queryKey: collectionKeys.lists(),
        id: variables.id,
      });
      void queryClient.invalidateQueries({ queryKey: collectionKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(variables.id),
      });
    },
  });
}
