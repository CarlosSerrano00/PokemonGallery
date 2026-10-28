export type PersonalType = 'favorito' | 'competitivo' | 'intercambio' | 'pendiente';

/**
 * Shape returned by MockAPI. `personalType` is kept as `string` because the
 * remote API is not schema-enforced and could contain an older/custom value.
 */
export type PokemonCollectionRecord = {
  id: string;
  pokemonId: number;
  name: string;
  spriteUrl: string;
  region: string;
  captured: boolean;
  priority: number;
  personalType: string;
  createdAt: string;
};

export type CreateCollectionInput = {
  pokemonId: number;
  name: string;
  spriteUrl: string;
  region: string;
  captured: boolean;
  priority: number;
  personalType: PersonalType;
  createdAt: string;
};

export type UpdateCollectionInput = {
  pokemonId: number;
  name: string;
  spriteUrl: string;
  region: string;
  captured: boolean;
  priority: number;
  personalType: PersonalType;
  createdAt: string;
};

/**
 * Client-only metadata used to tell an optimistic record apart from a record
 * already confirmed by MockAPI. These keys are never sent to the remote API.
 */
export type CollectionViewRecord = PokemonCollectionRecord & {
  __optimistic?: boolean;
  __optimisticId?: string;
};

export type CreateCollectionVariables = {
  optimisticId: string;
  input: CreateCollectionInput;
};

export type UpdateCollectionVariables = {
  id: string;
  input: UpdateCollectionInput;
};
