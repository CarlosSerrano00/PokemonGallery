import { requestJson } from '@/api/http';
import type {
  PokemonDetail,
  PokemonListResponse,
  PokemonSpecies,
} from '@/types/pokemon';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

function normalizeIdentifier(identifier: string | number): string {
  return encodeURIComponent(String(identifier).trim().toLowerCase());
}

/** Read-only PokéAPI client. It never performs write operations. */
export async function getPokemonList(limit: number, offset: number): Promise<PokemonListResponse> {
  return requestJson<PokemonListResponse>(
    `${POKEAPI_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`,
    { label: 'pokeapi:list' },
  );
}

export async function getPokemonDetail(identifier: string | number): Promise<PokemonDetail> {
  return requestJson<PokemonDetail>(
    `${POKEAPI_BASE_URL}/pokemon/${normalizeIdentifier(identifier)}`,
    { label: 'pokeapi:detail' },
  );
}

export async function getPokemonSpecies(identifier: string | number): Promise<PokemonSpecies> {
  return requestJson<PokemonSpecies>(
    `${POKEAPI_BASE_URL}/pokemon-species/${normalizeIdentifier(identifier)}`,
    { label: 'pokeapi:species' },
  );
}
