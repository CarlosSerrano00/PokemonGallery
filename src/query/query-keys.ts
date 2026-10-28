import type { PokemonListParams } from '@/types/pokemon';

function normalizeIdentifier(identifier: string | number): string {
  return String(identifier).trim().toLowerCase();
}

/**
 * Centralized, hierarchical query keys. Every query and invalidation should
 * reuse these helpers instead of building arrays inline.
 */
export const pokemonKeys = {
  all: ['pokemon'] as const,
  lists: () => [...pokemonKeys.all, 'list'] as const,
  list: (params: PokemonListParams) => [...pokemonKeys.lists(), params] as const,
  details: () => [...pokemonKeys.all, 'detail'] as const,
  detail: (identifier: string | number) =>
    [...pokemonKeys.details(), normalizeIdentifier(identifier)] as const,
  species: (identifier: string | number) =>
    [...pokemonKeys.all, 'species', normalizeIdentifier(identifier)] as const,
};

export const collectionKeys = {
  all: ['collection'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: () => [...collectionKeys.lists()] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...collectionKeys.details(), id] as const,
};

/**
 * Stable mutation keys. They are intentionally separate from the query keys so
 * `useMutationState` can filter operations without mixing mutation state with
 * cached query data.
 */
export const collectionMutationKeys = {
  all: ['collection-mutation'] as const,
  create: ['collection-mutation', 'create'] as const,
  update: ['collection-mutation', 'update'] as const,
};
