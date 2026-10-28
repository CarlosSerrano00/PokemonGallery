import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionProps = {
  kicker?: string;
  title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  style?: object;
};

export function Section({ kicker, title, action, children, style }: SectionProps) {
  const theme = useTheme();

  return (
    <View style={[styles.section, style]}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          {kicker ? (
            <Text style={[styles.kicker, { color: theme.accent }]}>{kicker.toUpperCase()}</Text>
          ) : null}
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headingText: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
  divider: {
    height: 1,
  },
});
