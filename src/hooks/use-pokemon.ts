import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getPokemonDetail, getPokemonList, getPokemonSpecies } from '@/api/pokeapi';
import { pokemonKeys } from '@/query/query-keys';

export function usePokemonList(page: number, limit = 20) {
  const offset = Math.max(0, page - 1) * limit;

  return useQuery({
    queryKey: pokemonKeys.list({ limit, offset }),
    queryFn: () => getPokemonList(limit, offset),
    placeholderData: keepPreviousData,
  });
}

export function usePokemonDetail(
  identifier: string | number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: pokemonKeys.detail(identifier ?? 'unknown'),
    queryFn: () => getPokemonDetail(identifier as string | number),
    enabled: Boolean(identifier) && enabled,
  });
}

export function usePokemonSpecies(
  identifier: string | number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: pokemonKeys.species(identifier ?? 'unknown'),
    queryFn: () => getPokemonSpecies(identifier as string | number),
    enabled: Boolean(identifier) && enabled,
  });
}
