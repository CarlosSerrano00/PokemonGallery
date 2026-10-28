import { useIsRestoring } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { DataStatusLine, FeedbackState } from '@/components/ui/feedback';
import { Content, Screen } from '@/components/ui/page';
import { PageHeader } from '@/components/ui/page-header';
import { Section } from '@/components/ui/section';
import { SyncStatusBanner } from '@/components/ui/sync-status-banner';
import { PokemonCard } from '@/features/pokedex/components/pokemon-card';
import { PokemonSprite } from '@/features/pokedex/components/pokemon-sprite';
import { SearchField } from '@/features/pokedex/components/search-field';
import { TypeBadge } from '@/features/pokedex/components/type-badge';
import {
  formatDexNumber,
  formatPokemonName,
  getBestSpriteUrl,
} from '@/constants/pokemon';
import { BottomTabInset, Fonts, Radius, Spacing } from '@/constants/theme';
import { usePokemonDetail, usePokemonList } from '@/hooks/use-pokemon';
import { useTheme } from '@/hooks/use-theme';
import { useNetworkStatus } from '@/query/network';
import { getErrorMessage, isNotFoundError } from '@/utils/errors';

const PAGE_SIZE = 20;

export default function PokedexScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { isOnline } = useNetworkStatus();
  const isRestoring = useIsRestoring();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  const listQuery = usePokemonList(page, PAGE_SIZE);
  const searchQuery = usePokemonDetail(
    submittedSearch || undefined,
    submittedSearch.length > 0,
  );

  const columns = width >= 820 ? 3 : width >= 360 ? 2 : 1;
  const data = listQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;
  const pageBusy = listQuery.isFetching || isRestoring;

  const handleSearch = () => {
    const term = searchInput.trim().toLowerCase();
    setSubmittedSearch(term);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSubmittedSearch('');
  };

  const handleRefresh = () => {
    if (!isOnline) return;
    void listQuery.refetch();
    if (submittedSearch) void searchQuery.refetch();
  };

  const openPokemon = (identifier: string | number) => {
    router.push({
      pathname: '/pokemon/[id]',
      params: { id: String(identifier) },
    });
  };

  const renderSearchResult = () => {
    if (!submittedSearch) return null;

    if (searchQuery.data) {
      const pokemon = searchQuery.data;
      const sprite = getBestSpriteUrl(pokemon);

      return (
        <View
          style={[
            styles.searchResult,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}>
          <View style={styles.searchResultTop}>
            <PokemonSprite uri={sprite} size={78} label={formatPokemonName(pokemon.name)} />
            <View style={styles.searchResultInfo}>
              <Text style={[styles.searchNumber, { color: theme.accent }]}>
                {formatDexNumber(pokemon.id)}
              </Text>
              <Text style={[styles.searchName, { color: theme.text }]}>
                {formatPokemonName(pokemon.name)}
              </Text>
              <View style={styles.searchTypes}>
                {pokemon.types.map((slot) => (
                  <TypeBadge key={slot.type.name} type={slot.type.name} />
                ))}
              </View>
            </View>
          </View>
          <Button
            label="Abrir ficha completa"
            size="sm"
            onPress={() => openPokemon(pokemon.id)}
            fullWidth
          />
          <DataStatusLine
            isFetching={searchQuery.isFetching}
            isStale={searchQuery.isStale}
            isError={searchQuery.isError}
            hasData
            dataUpdatedAt={searchQuery.dataUpdatedAt}
            sourceLabel="Búsqueda"
          />
        </View>
      );
    }

    if (searchQuery.isFetching || isRestoring) {
      return (
        <View style={[styles.searchMessage, { backgroundColor: theme.infoSoft, borderColor: theme.info }]}>
          <ActivityIndicator size="small" color={theme.info} />
          <Text style={[styles.searchMessageText, { color: theme.textSecondary }]}>
            Buscando «{submittedSearch}» en PokéAPI…
          </Text>
        </View>
      );
    }

    if (searchQuery.isError) {
      const notFound = isNotFoundError(searchQuery.error);
      return (
        <View
          style={[
            styles.searchMessage,
            {
              backgroundColor: notFound ? theme.warningSoft : theme.dangerSoft,
              borderColor: notFound ? theme.warning : theme.danger,
            },
          ]}>
          <Text style={[styles.searchMessageText, { color: theme.textSecondary }]}>
            {notFound
              ? `No encontramos «${submittedSearch}». Comprueba el nombre o el número.`
              : `${getErrorMessage(searchQuery.error)} Puedes intentarlo de nuevo sin perder los datos ya cargados.`}
          </Text>
        </View>
      );
    }

    if (searchQuery.fetchStatus === 'paused' || !isOnline) {
      return (
        <View style={[styles.searchMessage, { backgroundColor: theme.warningSoft, borderColor: theme.warning }]}>
          <Text style={[styles.searchMessageText, { color: theme.textSecondary }]}>
            Sin conexión y sin copia guardada para «{submittedSearch}». Vuelve a intentarlo cuando
            recuperes la conexión.
          </Text>
        </View>
      );
    }

    return null;
  };

  const listHeader = (
    <View style={styles.headerContent}>
      <PageHeader
        eyebrow="Enciclopedia Pokémon"
        title="Pokédex"
        subtitle="Busca y consulta fichas de Pokémon. Tus datos guardados también están disponibles sin conexión."
      />

      <SearchField
        value={searchInput}
        onChangeText={setSearchInput}
        onSubmit={handleSearch}
        onClear={handleClearSearch}
        loading={searchQuery.isFetching && submittedSearch.length > 0}
      />

      {renderSearchResult()}

      <SyncStatusBanner />

      <Section kicker={`Página ${page} de ${totalPages}`} title="Listado de especies">
        <DataStatusLine
          isFetching={listQuery.isFetching}
          isStale={listQuery.isStale}
          isError={listQuery.isError}
          hasData={Boolean(data)}
          isRestoring={isRestoring}
          dataUpdatedAt={listQuery.dataUpdatedAt}
          sourceLabel="PokéAPI"
        />
      </Section>

      {!isOnline ? (
        <Text style={[styles.offlineHint, { color: theme.textSecondary }]}>
          Estás sin conexión: se muestra la última página guardada. La paginación se habilitará al
          recuperar la red.
        </Text>
      ) : null}

      {listQuery.isError && !data ? (
        <FeedbackState
          tone="error"
          title="No se pudo cargar la Pokédex"
          message={getErrorMessage(listQuery.error)}
          actionLabel="Reintentar"
          onAction={() => void listQuery.refetch()}
          symbol="!"
        />
      ) : null}

      {!data && !isRestoring && listQuery.fetchStatus === 'paused' ? (
        <FeedbackState
          title="Sin datos guardados"
          message="No hay una copia local de esta página y el dispositivo está sin conexión. Recupera la red para cargar la Pokédex."
          symbol="⌁"
        />
      ) : null}

      {!data &&
      (isRestoring ||
        (listQuery.isPending && listQuery.fetchStatus !== 'paused')) ? (
        <ListSkeleton />
      ) : null}
    </View>
  );

  const listFooter = data ? (
    <View style={styles.footer}>
      <View style={[styles.pagination, { borderColor: theme.border }]}>
        <Button
          label="← Anterior"
          variant="secondary"
          size="sm"
          disabled={!canGoBack || !isOnline || pageBusy}
          onPress={() => setPage((current) => Math.max(1, current - 1))}
        />
        <View style={styles.pageIndicator}>
          <Text style={[styles.pageLabel, { color: theme.textSecondary }]}>PÁGINA</Text>
          <Text style={[styles.pageValue, { color: theme.text }]}>
            {page} / {totalPages}
          </Text>
        </View>
        <Button
          label="Siguiente →"
          variant="secondary"
          size="sm"
          disabled={!canGoForward || !isOnline || pageBusy}
          onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
        />
      </View>
      <Text style={[styles.footerNote, { color: theme.inkMuted }]}>
        {data.count} especies disponibles en PokéAPI · 20 por página
      </Text>
    </View>
  ) : null;

  return (
    <Screen>
      <Content style={styles.content}>
        <FlatList
          key={columns}
          data={data?.results ?? []}
          keyExtractor={(item) => item.url}
          numColumns={columns}
          renderItem={({ item }) => {
            const id = Number(/\/(\d+)\/?$/.exec(item.url)?.[1] ?? 0);
            return (
              <View style={[styles.cell, columns > 1 && styles.cellFlex]}>
                <PokemonCard item={item} onPress={() => openPokemon(id)} />
              </View>
            );
          }}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={
            data && data.results.length === 0 ? (
              <FeedbackState
                title="Sin resultados"
                message="PokéAPI no devolvió especies para esta página."
              />
            ) : null
          }
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            isOnline ? (
              <RefreshControl
                refreshing={listQuery.isRefetching && !isRestoring}
                onRefresh={handleRefresh}
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

function ListSkeleton() {
  const theme = useTheme();
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2, 3, 4].map((item) => (
        <View
          key={item}
          style={[
            styles.skeletonCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={[styles.skeletonBlock, { backgroundColor: theme.skeleton }]} />
          <View style={styles.skeletonInfo}>
            <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '55%' }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.skeleton, width: '35%' }]} />
          </View>
        </View>
      ))}
    </View>
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
  offlineHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  searchResult: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  searchResultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  searchResultInfo: {
    flex: 1,
    gap: 2,
  },
  searchNumber: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchName: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  searchTypes: {
    flexDirection: 'row',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  searchMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  searchMessageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  cell: {
    width: '100%',
  },
  cellFlex: {
    flex: 1,
  },
  columnWrapper: {
    gap: Spacing.two,
  },
  separator: {
    height: Spacing.three,
  },
  footer: {
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  pageIndicator: {
    alignItems: 'center',
    gap: 1,
  },
  pageLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  pageValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
  },
  skeletonList: {
    gap: Spacing.three,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  skeletonBlock: {
    width: 68,
    height: 68,
    borderRadius: Radius.md,
  },
  skeletonInfo: {
    flex: 1,
    gap: Spacing.two,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
