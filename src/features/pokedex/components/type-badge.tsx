import { StyleSheet, Text, View } from 'react-native';

import { getTypeStyle } from '@/constants/pokemon';
import { Radius, Spacing } from '@/constants/theme';

export function TypeBadge({ type }: { type: string }) {
  const style = getTypeStyle(type);
  return (
    <View style={[styles.badge, { backgroundColor: style.background }]}>
      <Text style={[styles.label, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
