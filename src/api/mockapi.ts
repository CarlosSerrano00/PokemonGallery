import { requestJson } from '@/api/http';
import { MOCKAPI_POKEMON_ENDPOINT } from '@/utils/env';
import { ApiError } from '@/utils/errors';
import { logEvent, logWarning } from '@/utils/logger';
import type {
  CollectionViewRecord,
  CreateCollectionInput,
  PokemonCollectionRecord,
  UpdateCollectionInput,
} from '@/types/collection';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

/**
 * MockAPI is not schema-enforced. This normalizer keeps the UI safe when a
 * remote record has missing or unexpected fields. It never writes back or
 * deletes remote data.
 */
export function normalizeCollectionRecord(raw: unknown): PokemonCollectionRecord | null {
  const record = asRecord(raw);
  if (!record) {
    logWarning('mockapi:record:skipped', { reason: 'not-an-object' });
    return null;
  }

  const id = readString(record.id);
  const pokemonId = Number(record.pokemonId);
  const name = readString(record.name);

  if (!id || !Number.isFinite(pokemonId) || pokemonId <= 0 || !name) {
    logWarning('mockapi:record:skipped', {
      reason: 'missing-identity',
      id: id ?? null,
      pokemonId: Number.isFinite(pokemonId) ? pokemonId : null,
    });
    return null;
  }

  const issues: string[] = [];
  const spriteUrl = readString(record.spriteUrl) ?? '';
  const region = readString(record.region) ?? 'Sin región';
  const createdAt = readString(record.createdAt) ?? '';
  const personalType = readString(record.personalType) ?? 'pendiente';

  if (!spriteUrl) issues.push('spriteUrl');
  if (!readString(record.region)) issues.push('region');
  if (!readString(record.createdAt)) issues.push('createdAt');
  if (!readString(record.personalType)) issues.push('personalType');

  const captured =
    typeof record.captured === 'boolean'
      ? record.captured
      : record.captured === 'true'
        ? true
        : record.captured === 'false'
          ? false
          : false;

  if (typeof record.captured !== 'boolean') issues.push('captured');

  const priorityValue = Number(record.priority);
  const priority = Number.isFinite(priorityValue) ? priorityValue : 0;
  if (!Number.isFinite(priorityValue)) issues.push('priority');

  if (issues.length > 0) {
    logWarning('mockapi:record:normalized', { id, issues });
  }

  return {
    id,
    pokemonId,
    name,
    spriteUrl,
    region,
    captured,
    priority,
    personalType,
    createdAt,
  };
}

function normalizeCollectionResponse(raw: unknown): PokemonCollectionRecord[] {
  if (!Array.isArray(raw)) {
    throw new ApiError('MockAPI devolvió una colección con un formato inesperado.');
  }

  const normalized = raw
    .map((item, index) => {
      const record = normalizeCollectionRecord(item);
      if (!record) {
        logWarning('mockapi:record:ignored', { index });
      }
      return record;
    })
    .filter((record): record is PokemonCollectionRecord => record !== null);

  logEvent('mockapi:collection:read', {
    received: raw.length,
    usable: normalized.length,
  });

  return normalized;
}

export async function getCollection(): Promise<CollectionViewRecord[]> {
  const raw = await requestJson<unknown>(MOCKAPI_POKEMON_ENDPOINT, {
    label: 'mockapi:collection:get',
  });
  return normalizeCollectionResponse(raw);
}

export async function getCollectionRecord(id: string): Promise<CollectionViewRecord> {
  const raw = await requestJson<unknown>(
    `${MOCKAPI_POKEMON_ENDPOINT}/${encodeURIComponent(id)}`,
    { label: 'mockapi:collection:get-one' },
  );
  const record = normalizeCollectionRecord(raw);
  if (!record) {
    throw new ApiError('MockAPI devolvió un registro con un formato inesperado.');
  }
  return record;
}

/**
 * `createdAt` acts as a client-generated reconciliation marker. MockAPI does
 * not support idempotency keys, so before creating we check whether a record
 * with the same marker already exists. This reduces duplicates after a lost
 * response, but it is not a strict exactly-once guarantee.
 */
export async function findReconcilableRecord(
  input: CreateCollectionInput,
): Promise<PokemonCollectionRecord | null> {
  const collection = await getCollection();
  return (
    collection.find(
      (record) =>
        record.createdAt === input.createdAt &&
        record.pokemonId === input.pokemonId &&
        record.name.toLowerCase() === input.name.toLowerCase(),
    ) ?? null
  );
}

function toRemotePayload(input: CreateCollectionInput | UpdateCollectionInput) {
  return {
    pokemonId: input.pokemonId,
    name: input.name,
    spriteUrl: input.spriteUrl,
    region: input.region,
    captured: input.captured,
    priority: input.priority,
    personalType: input.personalType,
    createdAt: input.createdAt,
  };
}

export async function createCollection(
  input: CreateCollectionInput,
): Promise<PokemonCollectionRecord> {
  let existing: PokemonCollectionRecord | null = null;

  try {
    existing = await findReconcilableRecord(input);
  } catch (error) {
    logWarning('mockapi:create:preflight:skipped', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }

  if (existing) {
    logEvent('mockapi:create:reconciled', {
      id: existing.id,
      pokemonId: existing.pokemonId,
    });
    return existing;
  }

  const raw = await requestJson<unknown>(MOCKAPI_POKEMON_ENDPOINT, {
    method: 'POST',
    // The payload intentionally has no `id`: MockAPI generates it.
    body: toRemotePayload(input),
    label: 'mockapi:collection:create',
  });

  const record = normalizeCollectionRecord(raw);
  if (!record) {
    throw new ApiError('MockAPI devolvió un registro inválido después de crearlo.');
  }
  return record;
}

export async function updateCollection(
  id: string,
  input: UpdateCollectionInput,
): Promise<PokemonCollectionRecord> {
  const raw = await requestJson<unknown>(
    `${MOCKAPI_POKEMON_ENDPOINT}/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: toRemotePayload(input),
      label: 'mockapi:collection:update',
    },
  );

  const record = normalizeCollectionRecord(raw);
  if (!record) {
    throw new ApiError('MockAPI devolvió un registro inválido después de editarlo.');
  }
  return record;
}
