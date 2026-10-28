import type { PersonalType } from '@/types/collection';

type TypeStyle = {
  label: string;
  background: string;
  text: string;
};

export const POKEMON_TYPE_STYLES: Record<string, TypeStyle> = {
  normal: { label: 'Normal', background: '#8A8F98', text: '#FFFFFF' },
  fire: { label: 'Fuego', background: '#D84315', text: '#FFFFFF' },
  water: { label: 'Agua', background: '#1565C0', text: '#FFFFFF' },
  electric: { label: 'Eléctrico', background: '#F2C037', text: '#302400' },
  grass: { label: 'Planta', background: '#2E7D32', text: '#FFFFFF' },
  ice: { label: 'Hielo', background: '#5FB7C9', text: '#06262B' },
  fighting: { label: 'Lucha', background: '#A63A2B', text: '#FFFFFF' },
  poison: { label: 'Veneno', background: '#7B3F9D', text: '#FFFFFF' },
  ground: { label: 'Tierra', background: '#B88A44', text: '#241505' },
  flying: { label: 'Volador', background: '#5C6BC0', text: '#FFFFFF' },
  psychic: { label: 'Psíquico', background: '#C2185B', text: '#FFFFFF' },
  bug: { label: 'Bicho', background: '#6A8E23', text: '#FFFFFF' },
  rock: { label: 'Roca', background: '#8D6E3A', text: '#FFFFFF' },
  ghost: { label: 'Fantasma', background: '#4A3F7B', text: '#FFFFFF' },
  dragon: { label: 'Dragón', background: '#3949AB', text: '#FFFFFF' },
  dark: { label: 'Siniestro', background: '#3B3432', text: '#FFFFFF' },
  steel: { label: 'Acero', background: '#6D7B84', text: '#FFFFFF' },
  fairy: { label: 'Hada', background: '#C75B8B', text: '#FFFFFF' },
  stellar: { label: 'Estelar', background: '#5E5A7A', text: '#FFFFFF' },
  unknown: { label: 'Desconocido', background: '#73777F', text: '#FFFFFF' },
};

export function getTypeStyle(type: string): TypeStyle {
  return (
    POKEMON_TYPE_STYLES[type.toLowerCase()] ?? {
      label: humanizeSlug(type),
      background: '#73777F',
      text: '#FFFFFF',
    }
  );
}

export const REGIONS = [
  'Kanto',
  'Johto',
  'Hoenn',
  'Sinnoh',
  'Unova',
  'Kalos',
  'Alola',
  'Galar',
  'Paldea',
] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_BY_GENERATION: Record<string, Region> = {
  'generation-i': 'Kanto',
  'generation-ii': 'Johto',
  'generation-iii': 'Hoenn',
  'generation-iv': 'Sinnoh',
  'generation-v': 'Unova',
  'generation-vi': 'Kalos',
  'generation-vii': 'Alola',
  'generation-viii': 'Galar',
  'generation-ix': 'Paldea',
};

export function inferRegionFromGeneration(generationName?: string | null): Region | null {
  if (!generationName) return null;
  return REGION_BY_GENERATION[generationName] ?? null;
}

export type PersonalTypeStyle = {
  value: PersonalType;
  label: string;
  background: string;
  text: string;
};

export const PERSONAL_TYPES: PersonalTypeStyle[] = [
  { value: 'favorito', label: 'Favorito', background: '#FBE9E7', text: '#9B211B' },
  { value: 'competitivo', label: 'Competitivo', background: '#E7F1FB', text: '#15508F' },
  { value: 'intercambio', label: 'Intercambio', background: '#E6F4EA', text: '#22652B' },
  { value: 'pendiente', label: 'Pendiente', background: '#FFF4E0', text: '#8A5300' },
];

export function getPersonalTypeStyle(value: string): PersonalTypeStyle {
  return (
    PERSONAL_TYPES.find((item) => item.value === value) ?? {
      value: 'pendiente',
      label: humanizeSlug(value || 'sin categoría'),
      background: '#EFECE6',
      text: '#4C4F56',
    }
  );
}

const STAT_LABELS: Record<string, string> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. especial',
  'special-defense': 'Def. especial',
  speed: 'Velocidad',
};

export function getStatLabel(stat: string): string {
  return STAT_LABELS[stat] ?? humanizeSlug(stat);
}

export function humanizeSlug(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatPokemonName(name: string): string {
  return humanizeSlug(name);
}

export function formatDexNumber(id: number | string): string {
  const numeric = Number(id);
  return Number.isFinite(numeric) ? `#${String(numeric).padStart(4, '0')}` : `#${id}`;
}

export function parsePokemonIdFromUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : 0;
}

export function getBestSpriteUrl(pokemon: {
  sprites?: {
    front_default?: string | null;
    other?: {
      'official-artwork'?: { front_default?: string | null };
      home?: { front_default?: string | null };
    };
  };
} | null | undefined): string | null {
  if (!pokemon?.sprites) return null;
  return (
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.other?.home?.front_default ??
    pokemon.sprites.front_default ??
    null
  );
}

export function cleanFlavorText(text: string): string {
  return text.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function formatMeasurement(value: number, unit: 'm' | 'kg'): string {
  // PokéAPI stores height in decimetres and weight in hectograms.
  return `${(value / 10).toFixed(1)} ${unit}`;
}
