import { useMutation } from '@tanstack/react-query';

import { collectionMutationKeys } from '@/query/query-keys';
import type {
  CreateCollectionVariables,
  PokemonCollectionRecord,
  UpdateCollectionVariables,
} from '@/types/collection';

/**
 * mutationFn, retry and cache reconciliation live in setMutationDefaults so a
 * paused mutation can resume after a cold start.
 */
export function useCreateCollection() {
  return useMutation<PokemonCollectionRecord, Error, CreateCollectionVariables>({
    mutationKey: collectionMutationKeys.create,
  });
}

export function useUpdateCollection() {
  return useMutation<PokemonCollectionRecord, Error, UpdateCollectionVariables>({
    mutationKey: collectionMutationKeys.update,
  });
}
