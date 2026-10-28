import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PokemonSprite } from '@/features/pokedex/components/pokemon-sprite';
import { TypeBadge } from '@/features/pokedex/components/type-badge';
import { usePokemonDetail } from '@/hooks/use-pokemon';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import {
  formatDexNumber,
  formatPokemonName,
  getBestSpriteUrl,
  parsePokemonIdFromUrl,
} from '@/constants/pokemon';
import type { NamedAPIResource } from '@/types/pokemon';

type Props = {
  item: NamedAPIResource;
  onPress: () => void;
};

export function PokemonCard({ item, onPress }: Props) {
  const theme = useTheme();
  const id = parsePokemonIdFromUrl(item.url);
  const detailQuery = usePokemonDetail(id);
  const sprite = getBestSpriteUrl(detailQuery.data);
  const types = detailQuery.data?.types ?? [];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ficha de ${formatPokemonName(item.name)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}>
      <View style={styles.cardTop}>
        <Text style={[styles.numberText, { color: theme.textSecondary }]}>
          {formatDexNumber(id)}
        </Text>
        <Text style={[styles.chevron, { color: theme.accent }]}>›</Text>
      </View>

      <View style={styles.sprite}>
        <PokemonSprite uri={sprite} size={80} label={formatPokemonName(item.name)} />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {formatPokemonName(item.name)}
        </Text>
        <View style={styles.types}>
          {types.length > 0 ? (
            types.map((slot) => <TypeBadge key={slot.type.name} type={slot.type.name} />)
          ) : (
            <Text style={[styles.typePlaceholder, { color: theme.inkMuted }]}>
              {detailQuery.isError ? 'Tipos no disponibles' : 'Cargando tipos…'}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 174,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two + 2,
    gap: Spacing.one,
  },
  cardTop: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sprite: {
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  info: {
    alignItems: 'center',
    gap: Spacing.one + 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  typePlaceholder: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '500',
  },
});
