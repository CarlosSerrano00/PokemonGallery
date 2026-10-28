import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useNetworkStatus } from '@/query/network';
import { useTheme } from '@/hooks/use-theme';

export function ConnectionPill() {
  const theme = useTheme();
  const { isOnline, checkedAt } = useNetworkStatus();

  const checking = checkedAt === null;
  const color = checking ? theme.warning : isOnline ? theme.success : theme.danger;
  const background = checking
    ? theme.warningSoft
    : isOnline
      ? theme.successSoft
      : theme.dangerSoft;
  const label = checking ? 'Comprobando' : isOnline ? 'En línea' : 'Sin conexión';

  return (
    <View style={[styles.pill, { backgroundColor: background }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

export function BrandMark() {
  const theme = useTheme();
  return (
    <View style={styles.pokeball} accessibilityElementsHidden>
      <View style={[styles.ballTop, { backgroundColor: theme.accent }]} />
      <View style={[styles.ballBottom, { backgroundColor: theme.surface }]} />
      <View style={[styles.ballBand, { backgroundColor: theme.text }]} />
      <View
        style={[
          styles.ballCenter,
          { backgroundColor: theme.surface, borderColor: theme.text },
        ]}
      />
    </View>
  );
}

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  eyebrow = 'Pokédex Offline',
  onBack,
  right,
  children,
}: PageHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandGroup}>
          <BrandMark />
          <View>
            <Text style={[styles.brand, { color: theme.text }]}>POKÉDEX</Text>
            <Text style={[styles.brandSub, { color: theme.accent }]}>OFFLINE</Text>
          </View>
        </View>
        {right ?? <ConnectionPill />}
      </View>

      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.back,
            { borderColor: theme.border, opacity: pressed ? 0.65 : 1 },
          ]}>
          <Text style={[styles.backText, { color: theme.accent }]}>‹ Volver</Text>
        </Pressable>
      ) : null}

      <View style={styles.titleBlock}>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow.toUpperCase()}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={[styles.rule, { backgroundColor: theme.border }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pokeball: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
  },
  ballTop: {
    flex: 1,
  },
  ballBottom: {
    flex: 1,
  },
  ballBand: {
    position: 'absolute',
    top: 13,
    left: 0,
    right: 0,
    height: 3,
  },
  ballCenter: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  brand: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.6,
    lineHeight: 15,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.6,
    lineHeight: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two - 2,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.one + 2,
    borderRadius: 999,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  back: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  backText: {
    fontSize: 13,
    fontWeight: '800',
  },
  titleBlock: {
    gap: Spacing.one,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 620,
  },
  rule: {
    height: 1,
    marginTop: Spacing.one,
  },
});
