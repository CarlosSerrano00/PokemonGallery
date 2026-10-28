export type NamedAPIResource = {
  name: string;
  url: string;
};

export type PokemonListParams = {
  limit: number;
  offset: number;
};

export type PokemonListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
};

export type PokemonTypeSlot = {
  slot: number;
  type: NamedAPIResource;
};

export type PokemonStat = {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
};

export type PokemonAbility = {
  ability: NamedAPIResource;
  is_hidden: boolean;
  slot: number;
};

export type PokemonSprites = {
  front_default: string | null;
  front_shiny?: string | null;
  back_default?: string | null;
  other?: {
    'official-artwork'?: {
      front_default?: string | null;
      front_shiny?: string | null;
    };
    home?: {
      front_default?: string | null;
    };
  };
};

export type PokemonDetail = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  types: PokemonTypeSlot[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  sprites: PokemonSprites;
  species: NamedAPIResource;
};

export type FlavorTextEntry = {
  flavor_text: string;
  language: NamedAPIResource;
  version?: NamedAPIResource;
};

export type GenusEntry = {
  genus: string;
  language: NamedAPIResource;
};

export type PokemonSpecies = {
  id: number;
  name: string;
  capture_rate?: number;
  base_happiness?: number;
  is_legendary?: boolean;
  is_mythical?: boolean;
  habitat?: NamedAPIResource | null;
  color?: NamedAPIResource;
  growth_rate?: NamedAPIResource;
  generation?: NamedAPIResource;
  egg_groups?: NamedAPIResource[];
  genera?: GenusEntry[];
  flavor_text_entries?: FlavorTextEntry[];
};
