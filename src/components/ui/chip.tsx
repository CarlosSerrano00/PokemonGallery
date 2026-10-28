import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
};

export function Chip({
  label,
  selected = false,
  onPress,
  backgroundColor,
  textColor,
  disabled = false,
}: ChipProps) {
  const theme = useTheme();
  const background = selected
    ? backgroundColor ?? theme.accent
    : theme.surface;
  const color = selected ? textColor ?? theme.onAccent : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected, disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: background,
          borderColor: selected ? background : theme.border,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 1,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
