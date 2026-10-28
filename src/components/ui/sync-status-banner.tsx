import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { Radius, Spacing } from '@/constants/theme';
import { useNetworkStatus } from '@/query/network';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/utils/date';

type Tone = 'warning' | 'danger' | 'info' | 'success';

export function SyncStatusBanner() {
  const theme = useTheme();
  const { isOnline, checkedAt } = useNetworkStatus();
  const { pausedCount, activeCount, errorCount, lastError, lastErrorAt, lastSuccessAt } =
    useSyncStatus();
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!lastSuccessAt) return;
    // The first sample is scheduled asynchronously; setting state directly in
    // the effect body would trigger a cascading render.
    const immediate = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      clearTimeout(immediate);
      clearInterval(timer);
    };
  }, [lastSuccessAt]);

  let tone: Tone | null = null;
  let title = '';
  let detail: string | null = null;

  if (checkedAt !== null && !isOnline) {
    tone = 'warning';
    title = 'Sin conexión';
    detail =
      pausedCount > 0
        ? `${pausedCount} cambio${pausedCount === 1 ? '' : 's'} esperando conexión. Se reintentará al volver a estar en línea.`
        : 'Se muestran los datos guardados. Las nuevas operaciones quedarán pendientes.';
  } else if (
    errorCount > 0 &&
    (lastSuccessAt === null || (lastErrorAt ?? 0) > lastSuccessAt)
  ) {
    tone = 'danger';
    title = 'Sincronización fallida';
    detail =
      lastError ??
      'La última operación no pudo confirmarse. Vuelve a intentarlo cuando recuperes la conexión.';
  } else if (activeCount > 0) {
    tone = 'info';
    title = 'Sincronizando con MockAPI…';
    detail = `${activeCount} operación${activeCount === 1 ? '' : 'es'} en curso.`;
  } else if (pausedCount > 0) {
    tone = 'info';
    title = 'Cambios pendientes';
    detail = `${pausedCount} operación${pausedCount === 1 ? '' : 'es'} se reanudará${pausedCount === 1 ? '' : 'n'} al recuperar la conexión.`;
  } else if (
    lastSuccessAt &&
    now >= lastSuccessAt &&
    now - lastSuccessAt < 45_000
  ) {
    tone = 'success';
    title = 'Última operación confirmada por MockAPI';
    detail = `Confirmada a las ${formatTime(lastSuccessAt)}.`;
  }

  if (!tone) return null;

  const palette = {
    warning: { background: theme.warningSoft, border: theme.warning, text: theme.warning },
    danger: { background: theme.dangerSoft, border: theme.danger, text: theme.danger },
    info: { background: theme.infoSoft, border: theme.info, text: theme.info },
    success: { background: theme.successSoft, border: theme.success, text: theme.success },
  }[tone];

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: palette.background, borderColor: palette.border }]}>
      {tone === 'info' ? (
        <ActivityIndicator size="small" color={palette.text} style={styles.spinner} />
      ) : (
        <View style={[styles.dot, { backgroundColor: palette.text }]} />
      )}
      <View style={styles.textGroup}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {detail ? (
          <Text style={[styles.detail, { color: theme.textSecondary }]} numberOfLines={3}>
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 5,
  },
  spinner: {
    marginTop: -1,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  detail: {
    fontSize: 12,
    lineHeight: 18,
  },
});
