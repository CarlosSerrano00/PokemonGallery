import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatusProps = {
  isFetching?: boolean;
  isStale?: boolean;
  isError?: boolean;
  hasData?: boolean;
  isRestoring?: boolean;
  dataUpdatedAt?: number;
  sourceLabel?: string;
};

export function DataStatusLine({
  isFetching = false,
  isStale = false,
  isError = false,
  hasData = false,
  isRestoring = false,
  dataUpdatedAt,
  sourceLabel,
}: StatusProps) {
  const theme = useTheme();

  let label = '';
  let color: string = theme.inkMuted;

  if (isRestoring) {
    label = 'Restaurando caché local…';
    color = theme.info;
  } else if (isFetching) {
    label = 'Actualizando…';
    color = theme.info;
  } else if (isError && hasData) {
    label = 'Mostrando copia guardada';
    color = theme.warning;
  } else if (!hasData) {
    label = 'Sin datos cargados';
    color = theme.inkMuted;
  } else if (isStale) {
    label = 'Datos en caché';
    color = theme.inkMuted;
  } else {
    label = 'Actualizado';
    color = theme.success;
  }

  const time = dataUpdatedAt
    ? ` · ${String(new Date(dataUpdatedAt).getHours()).padStart(2, '0')}:${String(
        new Date(dataUpdatedAt).getMinutes(),
      ).padStart(2, '0')}`
    : '';

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>
        {sourceLabel ? `${sourceLabel} · ` : ''}
        {label}
        {!isFetching && !isRestoring ? time : ''}
      </Text>
    </View>
  );
}

type FeedbackProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'error' | 'empty';
  symbol?: string;
};

export function FeedbackState({
  title,
  message,
  actionLabel,
  onAction,
  tone = 'empty',
  symbol = '?',
}: FeedbackProps) {
  const theme = useTheme();
  const isError = tone === 'error';
  const accent = isError ? theme.danger : theme.accent;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
      ]}>
      <View style={[styles.symbol, { backgroundColor: isError ? theme.dangerSoft : theme.accentSoft }]}>
        <Text style={[styles.symbolText, { color: accent }]}>{symbol}</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Text
          accessibilityRole="button"
          onPress={onAction}
          style={[styles.action, { color: theme.accent }]}>
          {actionLabel} →
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  symbol: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  symbolText: {
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.two,
    fontSize: 14,
    fontWeight: '800',
  },
});
