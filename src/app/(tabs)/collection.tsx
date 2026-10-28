import { useIsRestoring } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { DataStatusLine, FeedbackState } from '@/components/ui/feedback';
import { Content, Screen } from '@/components/ui/page';
import { PageHeader } from '@/components/ui/page-header';
import { Section } from '@/components/ui/section';
import { SyncStatusBanner } from '@/components/ui/sync-status-banner';
import { CollectionCard } from '@/features/collection/components/collection-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useCollection } from '@/hooks/use-collection';
import { useTheme } from '@/hooks/use-theme';
import { useNetworkStatus } from '@/query/network';
import type { CollectionViewRecord } from '@/types/collection';
import { getErrorMessage } from '@/utils/errors';

type CollectionFilter = 'all' | 'captured' | 'pending' | 'unsynced';
type SortMode = 'priority' | 'name';

export default function CollectionScreen() {
  const theme = useTheme();
  const { isOnline } = useNetworkStatus();
  const isRestoring = useIsRestoring();
  const collectionQuery = useCollection();

  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [sort, setSort] = useState<SortMode>('priority');

  const records = collectionQuery.data ?? [];
  const capturedCount = records.filter((record) => record.captured).length;
  const pendingCount = records.length - capturedCount;
  const unsyncedCount = records.filter((record) => record.__optimistic).length;

  const filtered = records.filter((record) => {
    if (filter === 'captured') return record.captured;
    if (filter === 'pending') return !record.captured;
    if (filter === 'unsynced') return Boolean(record.__optimistic);
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (Boolean(a.__optimistic) !== Boolean(b.__optimistic)) {
      return a.__optimistic ? -1 : 1;
    }
    if (sort === 'priority' && a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return a.name.localeCompare(b.name);
  });

  const openRecord = (record: CollectionViewRecord) => {
    if (record.__optimistic) return;
    router.push({
      pathname: '/collection/[id]',
      params: { id: record.id },
    });
  };

  const listHeader = (
    <View style={styles.headerContent}>
      <PageHeader
        eyebrow="Archivo personal"
        title="Mi colección"
        subtitle="Organiza tus Pokémon y consulta su estado de captura. Los cambios sin conexión se sincronizan al recuperar la red."
      />

      <SyncStatusBanner />

      <Section
        kicker={`${records.length} registro${records.length === 1 ? '' : 's'}`}
        title="Organiza tu equipo"
        action={
          <Button
            label="Explorar Pokédex"
            variant="secondary"
            size="sm"
            onPress={() => router.navigate('/')}
          />
        }>
        <Text style={[styles.summary, { color: theme.textSecondary }]}>
          {capturedCount} capturado{capturedCount === 1 ? '' : 's'} · {pendingCount} por capturar
          {unsyncedCount > 0 ? ` · ${unsyncedCount} sin sincronizar` : ''}
        </Text>

        <ChipRow>
          <Chip
            label={`Todos (${records.length})`}
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label={`Capturados (${capturedCount})`}
            selected={filter === 'captured'}
            onPress={() => setFilter('captured')}
          />
          <Chip
            label={`Por capturar (${pendingCount})`}
            selected={filter === 'pending'}
            onPress={() => setFilter('pending')}
          />
          {unsyncedCount > 0 ? (
            <Chip
              label={`Sin sincronizar (${unsyncedCount})`}
              selected={filter === 'unsynced'}
              onPress={() => setFilter('unsynced')}
            />
          ) : null}
        </ChipRow>

        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: theme.inkMuted }]}>ORDENAR POR</Text>
          <Chip
            label="Prioridad ↓"
            selected={sort === 'priority'}
            onPress={() => setSort('priority')}
          />
          <Chip label="Nombre A-Z" selected={sort === 'name'} onPress={() => setSort('name')} />
        </View>

        <DataStatusLine
          isFetching={collectionQuery.isFetching}
          isStale={collectionQuery.isStale}
          isError={collectionQuery.isError}
          hasData={Boolean(collectionQuery.data)}
          isRestoring={isRestoring}
          dataUpdatedAt={collectionQuery.dataUpdatedAt}
          sourceLabel="MockAPI"
        />
      </Section>

      {!isOnline ? (
        <Text style={[styles.offlineHint, { color: theme.textSecondary }]}>
          Sin conexión: se muestra la colección guardada. Puedes abrir los registros confirmados y
          guardar cambios, que quedarán pendientes.
        </Text>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (collectionQuery.isError && !collectionQuery.data) {
      return (
        <FeedbackState
          tone="error"
          title="No se pudo cargar la colección"
          message={getErrorMessage(collectionQuery.error)}
          actionLabel="Reintentar"
          onAction={() => void collectionQuery.refetch()}
          symbol="!"
        />
      );
    }

    if (!collectionQuery.data && !isRestoring) {
      if (collectionQuery.fetchStatus === 'paused' || !isOnline) {
        return (
          <FeedbackState
            title="Sin datos guardados"
            message="No hay una copia local de tu colección y el dispositivo está sin conexión. Recupera la red para cargarla."
            symbol="⌁"
          />
        );
      }
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando tu colección…
          </Text>
        </View>
      );
    }

    if (records.length === 0) {
      return (
        <FeedbackState
          title="Tu colección está vacía"
          message="Abre la Pokédex, elige un Pokémon y pulsa «Añadir a mi colección» para crear tu primer registro."
          actionLabel="Ir a la Pokédex"
          onAction={() => router.navigate('/')}
          symbol="＋"
        />
      );
    }

    return (
      <FeedbackState
        title="No hay registros con este filtro"
        message="Cambia el filtro para volver a ver tu colección completa."
        actionLabel="Ver todos"
        onAction={() => setFilter('all')}
        symbol="○"
      />
    );
  };

  return (
    <Screen>
      <Content style={styles.content}>
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CollectionCard record={item} onPress={() => openRecord(item)} />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            collectionQuery.isPending || isRestoring ? (
              collectionQuery.fetchStatus === 'paused' && !isRestoring ? (
                <FeedbackState
                  title="Sin datos guardados"
                  message="No hay una copia local de tu colección y el dispositivo está sin conexión. Recupera la red para cargarla."
                  symbol="⌁"
                />
              ) : (
                <View style={styles.loading}>
                  <ActivityIndicator color={theme.accent} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Restaurando colección…
                  </Text>
                </View>
              )
            ) : (
              renderEmpty()
            )
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            isOnline ? (
              <RefreshControl
                refreshing={collectionQuery.isRefetching && !isRestoring}
                onRefresh={() => void collectionQuery.refetch()}
                tintColor={theme.accent}
                colors={[theme.accent]}
              />
            ) : undefined
          }
        />
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  headerContent: {
    gap: Spacing.four,
    marginBottom: Spacing.four,
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  sortLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginRight: Spacing.one,
  },
  offlineHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  separator: {
    height: Spacing.three,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
