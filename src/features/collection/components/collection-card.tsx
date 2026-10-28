import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PokemonSprite } from '@/features/pokedex/components/pokemon-sprite';
import { getPersonalTypeStyle, formatDexNumber, formatPokemonName } from '@/constants/pokemon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CollectionViewRecord } from '@/types/collection';

type Props = {
  record: CollectionViewRecord;
  onPress: () => void;
};

export function CollectionCard({ record, onPress }: Props) {
  const theme = useTheme();
  const personal = getPersonalTypeStyle(record.personalType);
  const isPendingSync = Boolean(record.__optimistic);
  const statusColor = record.captured ? theme.success : theme.warning;
  const statusBackground = record.captured ? theme.successSoft : theme.warningSoft;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar ${formatPokemonName(record.name)}`}
      accessibilityState={{ disabled: isPendingSync }}
      onPress={isPendingSync ? undefined : onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderLeftColor: statusColor,
          opacity: pressed ? 0.84 : 1,
        },
      ]}>
      <View style={[styles.statusRail, { backgroundColor: statusColor }]} />

      <PokemonSprite uri={record.spriteUrl} size={66} label={formatPokemonName(record.name)} />

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {formatPokemonName(record.name)}
          </Text>
          <Text style={[styles.number, { color: theme.inkMuted }]}>
            {formatDexNumber(record.pokemonId)}
          </Text>
        </View>

        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {record.region} · Prioridad {record.priority}
        </Text>

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: personal.background }]}>
            <Text style={[styles.badgeText, { color: personal.text }]}>{personal.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusBackground }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {record.captured ? 'Capturado' : 'Por capturar'}
            </Text>
          </View>
          {isPendingSync ? (
            <View style={[styles.badge, { backgroundColor: theme.infoSoft }]}>
              <Text style={[styles.badgeText, { color: theme.info }]}>Sin sincronizar</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.trailing}>
        <View style={[styles.priority, { backgroundColor: theme.surfaceMuted }]}>
          <Text style={[styles.priorityLabel, { color: theme.textSecondary }]}>PRIORIDAD</Text>
          <Text style={[styles.priorityValue, { color: theme.text }]}>{record.priority}</Text>
        </View>
        <Text style={[styles.edit, { color: isPendingSync ? theme.inkMuted : theme.accent }]}>
          {isPendingSync ? 'Pendiente' : 'Editar'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRadius: Radius.md,
    padding: Spacing.three,
    overflow: 'hidden',
  },
  statusRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  info: {
    flex: 1,
    gap: Spacing.one + 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  number: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  priority: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    minWidth: 56,
  },
  priorityLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  priorityValue: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  edit: {
    fontSize: 11,
    fontWeight: '800',
  },
});
