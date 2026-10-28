import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';

import { createCollection } from '@/api/mockapi';
import { getConnectivitySnapshot } from '@/query/network';
import { collectionKeys } from '@/query/query-keys';
import type {
  CollectionViewRecord,
  CreateCollectionVariables,
  PokemonCollectionRecord,
} from '@/types/collection';
import { logEvent, logWarning } from '@/utils/logger';

const OUTBOX_STORAGE_KEY = 'pokedex-offline:collection-create-outbox:v1';

let storageQueue = Promise.resolve();
let flushPromise: Promise<void> | null = null;

function withStorageLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageQueue.then(operation);
  storageQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

function parseOutbox(value: string | null): CreateCollectionVariables[] {
  if (value === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    logWarning('outbox:restore:invalid-json', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    throw new Error('No se pudo leer la cola local de registros pendientes.');
  }

  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.optimisticId === 'string' &&
        item.input &&
        typeof item.input === 'object' &&
        Number.isFinite(item.input.pokemonId) &&
        typeof item.input.name === 'string' &&
        typeof item.input.spriteUrl === 'string' &&
        typeof item.input.region === 'string' &&
        typeof item.input.captured === 'boolean' &&
        Number.isFinite(item.input.priority) &&
        typeof item.input.personalType === 'string' &&
        typeof item.input.createdAt === 'string',
    )
  ) {
    logWarning('outbox:restore:invalid-shape');
    throw new Error('La cola local contiene un registro con formato inválido.');
  }

  return parsed as CreateCollectionVariables[];
}

async function readOutbox(): Promise<CreateCollectionVariables[]> {
  return parseOutbox(await AsyncStorage.getItem(OUTBOX_STORAGE_KEY));
}

async function writeOutbox(items: CreateCollectionVariables[]): Promise<void> {
  await AsyncStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(items));
}

function optimisticRecord(variables: CreateCollectionVariables): CollectionViewRecord {
  return {
    ...variables.input,
    id: variables.optimisticId,
    __optimistic: true,
    __optimisticId: variables.optimisticId,
  };
}

function addOptimisticRecord(
  client: QueryClient,
  variables: CreateCollectionVariables,
): void {
  const pending = optimisticRecord(variables);
  const cachedLists = client.getQueryCache().findAll({
    queryKey: collectionKeys.lists(),
  });

  if (cachedLists.length === 0) {
    client.setQueryData<CollectionViewRecord[]>(collectionKeys.list(), [pending]);
    return;
  }

  client.setQueriesData<CollectionViewRecord[]>(
    { queryKey: collectionKeys.lists() },
    (records) => [
      pending,
      ...(records ?? []).filter(
        (record) =>
          record.id !== pending.id && record.__optimisticId !== pending.__optimisticId,
      ),
    ],
  );
}

function reconcileRecord(client: QueryClient, record: PokemonCollectionRecord, optimisticId: string): void {
  const cachedLists = client.getQueryCache().findAll({
    queryKey: collectionKeys.lists(),
  });
  const replace = (records: CollectionViewRecord[] | undefined) => [
    { ...record },
    ...(records ?? []).filter(
      (item) =>
        item.id !== optimisticId &&
        item.__optimisticId !== optimisticId &&
        item.id !== record.id,
    ),
  ];

  if (cachedLists.length === 0) {
    client.setQueryData<CollectionViewRecord[]>(collectionKeys.list(), replace(undefined));
  } else {
    client.setQueriesData<CollectionViewRecord[]>(
      { queryKey: collectionKeys.lists() },
      replace,
    );
  }

  client.setQueryData(collectionKeys.detail(record.id), record);
}

export async function enqueueCollectionCreate(
  client: QueryClient,
  variables: CreateCollectionVariables,
): Promise<void> {
  await withStorageLock(async () => {
    const queued = await readOutbox();
    if (!queued.some((item) => item.optimisticId === variables.optimisticId)) {
      await writeOutbox([...queued, variables]);
    }
  });

  await client.cancelQueries({ queryKey: collectionKeys.all });
  addOptimisticRecord(client, variables);
  logEvent('outbox:create:queued', {
    optimisticId: variables.optimisticId,
    pokemonId: variables.input.pokemonId,
  });
}

export async function restoreCollectionOutbox(client: QueryClient): Promise<void> {
  const queued = await withStorageLock(readOutbox);
  if (queued.length === 0) return;

  await client.cancelQueries({ queryKey: collectionKeys.all });
  queued.forEach((variables) => addOptimisticRecord(client, variables));
  logEvent('outbox:restore:success', { pending: queued.length });
}

export function flushCollectionOutbox(client: QueryClient): Promise<void> {
  if (flushPromise) return flushPromise;

  flushPromise = (async () => {
    const connectivity = getConnectivitySnapshot();
    if (connectivity.checkedAt === null || !connectivity.isOnline) {
      logEvent('outbox:flush:deferred', {
        reason: connectivity.checkedAt === null ? 'connectivity-unknown' : 'offline',
      });
      return;
    }

    const queued = await withStorageLock(readOutbox);

    for (const variables of queued) {
      try {
        const record = await createCollection(variables.input);
        reconcileRecord(client, record, variables.optimisticId);
        await withStorageLock(async () => {
          const current = await readOutbox();
          await writeOutbox(
            current.filter((item) => item.optimisticId !== variables.optimisticId),
          );
        });
        logEvent('outbox:create:confirmed', {
          optimisticId: variables.optimisticId,
          id: record.id,
          pokemonId: record.pokemonId,
        });
      } catch (error) {
        logWarning('outbox:create:deferred', {
          optimisticId: variables.optimisticId,
          message: error instanceof Error ? error.message : 'unknown',
        });
        break;
      }
    }
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}
