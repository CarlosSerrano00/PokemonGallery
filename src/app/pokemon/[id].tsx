import { useIsRestoring } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DataStatusLine, FeedbackState } from '@/components/ui/feedback';
import { PageScroll, Screen } from '@/components/ui/page';
import { PageHeader } from '@/components/ui/page-header';
import { Section } from '@/components/ui/section';
import { PokemonSprite } from '@/features/pokedex/components/pokemon-sprite';
import { TypeBadge } from '@/features/pokedex/components/type-badge';
import {
  cleanFlavorText,
  formatDexNumber,
  formatMeasurement,
  formatPokemonName,
  getBestSpriteUrl,
  getPersonalTypeStyle,
  getStatLabel,
  getTypeStyle,
  humanizeSlug,
  inferRegionFromGeneration,
} from '@/constants/pokemon';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useCollection } from '@/hooks/use-collection';
import { usePokemonDetail, usePokemonSpecies } from '@/hooks/use-pokemon';
import { useTheme } from '@/hooks/use-theme';
import { isNotFoundError, getErrorMessage } from '@/utils/errors';

export default function PokemonDetailScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isRestoring = useIsRestoring();

  const detailQuery = usePokemonDetail(id);
  // Species ids match Pokémon ids for the national dex, and the exercise
  // requires the numbered `pokemon-species/{id}` endpoint.
  const speciesQuery = usePokemonSpecies(
    detailQuery.data?.id,
    Boolean(detailQuery.data?.id),
  );
  const collectionQuery = useCollection();

  const pokemon = detailQuery.data;
  const species = speciesQuery.data;
  const sprite = getBestSpriteUrl(pokemon);
  const primaryType = pokemon?.types[0]?.type.name;
  const typeStyle = primaryType ? getTypeStyle(primaryType) : null;
  const wide = width >= 620;

  const existing = collectionQuery.data?.find(
    (record) => pokemon && record.pokemonId === pokemon.id && !record.__optimistic,
  );
  const pendingRecord = collectionQuery.data?.find(
    (record) => pokemon && record.pokemonId === pokemon.id && record.__optimistic,
  );

  const genusEntry =
    species?.genera?.find((entry) => entry.language.name === 'es') ??
    species?.genera?.find((entry) => entry.language.name === 'en');
  const flavorEntry =
    species?.flavor_text_entries?.find((entry) => entry.language.name === 'es') ??
    species?.flavor_text_entries?.find((entry) => entry.language.name === 'en');
  const flavorLanguage = flavorEntry?.language.name;

  const region = inferRegionFromGeneration(species?.generation?.name);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const openAddForm = () => {
    if (!pokemon) return;
    router.push({
      pathname: '/collection/new',
      params: {
        pokemonId: String(pokemon.id),
        name: pokemon.name,
        spriteUrl: sprite ?? '',
        region: region ?? '',
        personalType: 'favorito',
      },
    });
  };

  const openEditForm = () => {
    if (!existing) return;
    router.push({
      pathname: '/collection/[id]',
      params: { id: existing.id },
    });
  };

  if (detailQuery.isError && !pokemon) {
    const notFound = isNotFoundError(detailQuery.error);
    return (
      <Screen>
        <PageScroll>
          <PageHeader
            eyebrow="Pokédex nacional"
            title="Ficha de especie"
            onBack={handleBack}
          />
          <FeedbackState
            tone="error"
            title={notFound ? 'Pokémon no encontrado' : 'No se pudo cargar la ficha'}
            message={
              notFound
                ? `No existe una especie con el identificador «${id}». Vuelve a la Pokédex e inténtalo de nuevo.`
                : `${getErrorMessage(detailQuery.error)} Si ya visitaste esta ficha, sus datos pueden seguir en la caché.`
            }
            actionLabel={notFound ? 'Volver a la Pokédex' : 'Reintentar'}
            onAction={
              notFound
                ? () => router.replace('/')
                : () => void detailQuery.refetch()
            }
            symbol="!"
          />
        </PageScroll>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageScroll>
        <View style={styles.stack}>
          <PageHeader
            eyebrow="Pokédex nacional"
            title="Ficha de especie"
            subtitle="Datos de PokéAPI, estadísticas base y descripción de la especie."
            onBack={handleBack}
          />

          {!pokemon && !isRestoring && detailQuery.fetchStatus === 'paused' ? (
            <FeedbackState
              title="Sin copia guardada de esta ficha"
              message={`No hay datos locales de «${id}» y el dispositivo está sin conexión. Vuelve a abrir esta ficha cuando recuperes la red para guardarla en la caché.`}
              actionLabel="Volver a la Pokédex"
              onAction={() => router.replace('/')}
              symbol="⌁"
            />
          ) : !pokemon ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={theme.accent} size="large" />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                {isRestoring ? 'Restaurando ficha guardada…' : 'Cargando ficha…'}
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.hero,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    shadowColor: theme.shadow,
                    flexDirection: wide ? 'row' : 'column',
                  },
                ]}>
                <View style={styles.spriteWrap}>
                  <PokemonSprite
                    uri={sprite}
                    size={wide ? 168 : 142}
                    label={formatPokemonName(pokemon.name)}
                  />
                </View>

                <View style={[styles.heroInfo, !wide && styles.heroInfoNarrow]}>
                  <Text style={[styles.dexNumber, { color: theme.accent }]}>
                    {formatDexNumber(pokemon.id)}
                  </Text>
                  <Text style={[styles.name, { color: theme.text }]}>
                    {formatPokemonName(pokemon.name)}
                  </Text>
                  {genusEntry ? (
                    <Text style={[styles.genus, { color: theme.textSecondary }]}>
                      {genusEntry.genus}
                    </Text>
                  ) : null}
                  <View style={[styles.types, !wide && styles.typesNarrow]}>
                    {pokemon.types.map((slot) => (
                      <TypeBadge key={slot.type.name} type={slot.type.name} />
                    ))}
                  </View>

                  <DataStatusLine
                    isFetching={detailQuery.isFetching}
                    isStale={detailQuery.isStale}
                    isError={detailQuery.isError}
                    hasData
                    dataUpdatedAt={detailQuery.dataUpdatedAt}
                    sourceLabel="PokéAPI"
                  />
                </View>
              </View>

              <View
                style={[
                  styles.descriptionCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}>
                <Section kicker="Entrada de la Pokédex" title="Descripción">
                  {speciesQuery.isPending && speciesQuery.fetchStatus !== 'paused' ? (
                    <View style={styles.inlineLoading}>
                      <ActivityIndicator size="small" color={theme.accent} />
                      <Text style={[styles.help, { color: theme.textSecondary }]}>
                        Cargando datos de especie…
                      </Text>
                    </View>
                  ) : speciesQuery.fetchStatus === 'paused' && !species ? (
                    <Text style={[styles.help, { color: theme.textSecondary }]}>
                      Sin conexión: no hay una copia guardada de la descripción de esta especie.
                      Los datos de la ficha principal siguen disponibles.
                    </Text>
                  ) : speciesQuery.isError && !species ? (
                    <Text style={[styles.help, { color: theme.textSecondary }]}>
                      No se pudo cargar la descripción de la especie (
                      {getErrorMessage(speciesQuery.error)}).
                    </Text>
                  ) : flavorEntry ? (
                    <>
                      <Text style={[styles.flavor, { color: theme.text }]}>
                        {cleanFlavorText(flavorEntry.flavor_text)}
                      </Text>
                      <View style={styles.descriptionMeta}>
                        {flavorLanguage && flavorLanguage !== 'es' ? (
                          <Text style={[styles.help, { color: theme.warning }]}>
                            Texto disponible originalmente en inglés.
                          </Text>
                        ) : null}
                        <DataStatusLine
                          isFetching={speciesQuery.isFetching}
                          isStale={speciesQuery.isStale}
                          isError={speciesQuery.isError}
                          hasData={Boolean(species)}
                          dataUpdatedAt={speciesQuery.dataUpdatedAt}
                          sourceLabel="Especie"
                        />
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.help, { color: theme.textSecondary }]}>
                      PokéAPI no proporciona una descripción para esta especie
                      {speciesQuery.isError ? ` (${getErrorMessage(speciesQuery.error)})` : ''}.
                    </Text>
                  )}
                </Section>
              </View>

              <View
                style={[
                  styles.panel,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}>
                <Section kicker="Rendimiento" title="Estadísticas base">
                  <View style={styles.stats}>
                    {pokemon.stats.map((stat) => {
                      const value = stat.base_stat;
                      const percent = Math.min(100, Math.round((value / 255) * 100));
                      return (
                        <View key={stat.stat.name} style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                            {getStatLabel(stat.stat.name)}
                          </Text>
                          <View
                            style={[styles.statTrack, { backgroundColor: theme.surfaceMuted }]}>
                            <View
                              style={[
                                styles.statFill,
                                {
                                  width: `${percent}%`,
                                  backgroundColor: typeStyle?.background ?? theme.accent,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
                        </View>
                      );
                    })}
                  </View>
                </Section>
              </View>

              <View
                style={[
                  styles.panel,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}>
                <Section kicker="Datos de especie" title="Ficha enciclopédica">
                  <View style={styles.factsGrid}>
                    <Fact label="Altura" value={formatMeasurement(pokemon.height, 'm')} />
                    <Fact label="Peso" value={formatMeasurement(pokemon.weight, 'kg')} />
                    <Fact
                      label="Hábitat"
                      value={species?.habitat?.name ? humanizeSlug(species.habitat.name) : 'No disponible'}
                    />
                    <Fact
                      label="Generación"
                      value={
                        species?.generation?.name
                          ? humanizeSlug(species.generation.name).replace('Generation', 'Generación')
                          : 'No disponible'
                      }
                    />
                    <Fact
                      label="Ratio de captura"
                      value={
                        typeof species?.capture_rate === 'number'
                          ? String(species.capture_rate)
                          : 'No disponible'
                      }
                    />
                    <Fact
                      label="Felicidad base"
                      value={
                        typeof species?.base_happiness === 'number'
                          ? String(species.base_happiness)
                          : 'No disponible'
                      }
                    />
                    <Fact
                      label="Experiencia base"
                      value={
                        typeof pokemon.base_experience === 'number'
                          ? String(pokemon.base_experience)
                          : 'No disponible'
                      }
                    />
                    <Fact
                      label="Legendario / mítico"
                      value={
                        species
                          ? `${species.is_legendary ? 'Legendario' : 'No legendario'} · ${
                              species.is_mythical ? 'Mítico' : 'No mítico'
                            }`
                          : 'No disponible'
                      }
                    />
                  </View>

                  <Fact
                    label="Habilidades"
                    value={
                      pokemon.abilities.length > 0
                        ? pokemon.abilities
                            .map(
                              (ability) =>
                                `${humanizeSlug(ability.ability.name)}${
                                  ability.is_hidden ? ' (oculta)' : ''
                                }`,
                            )
                            .join(', ')
                        : 'No disponible'
                    }
                    full
                  />
                  {species?.egg_groups && species.egg_groups.length > 0 ? (
                    <Fact
                      label="Grupos huevo"
                      value={species.egg_groups.map((group) => humanizeSlug(group.name)).join(', ')}
                      full
                    />
                  ) : null}
                  {species?.growth_rate?.name ? (
                    <Fact
                      label="Crecimiento"
                      value={humanizeSlug(species.growth_rate.name)}
                      full
                    />
                  ) : null}
                </Section>
              </View>

              <View
                style={[
                  styles.collectionCard,
                  {
                    backgroundColor: existing ? theme.successSoft : theme.accentSoft,
                    borderColor: existing ? theme.success : theme.accent,
                  },
                ]}>
                <Text style={[styles.collectionKicker, { color: existing ? theme.success : theme.accent }]}>
                  {existing ? 'YA EN TU COLECCIÓN' : 'COLECCIÓN PERSONAL'}
                </Text>
                <Text style={[styles.collectionTitle, { color: theme.text }]}>
                  {existing
                    ? 'Este Pokémon ya tiene un registro personal'
                    : pendingRecord
                      ? 'Hay un registro pendiente de sincronizar'
                      : 'Guarda este Pokémon en tu archivo'}
                </Text>
                <Text style={[styles.help, { color: theme.textSecondary }]}>
                  {existing
                    ? `Categoría ${getPersonalTypeStyle(existing.personalType).label} · ${existing.region} · prioridad ${existing.priority}.`
                    : 'Podrás elegir región, estado de captura, prioridad y categoría personal.'}
                </Text>

                {existing ? (
                  <Button label="Editar registro" onPress={openEditForm} />
                ) : (
                  <Button label="Añadir a mi colección" onPress={openAddForm} />
                )}

                {pendingRecord ? (
                  <Text style={[styles.help, { color: theme.textSecondary }]}>
                    El registro pendiente aparecerá en «Mi colección» con la etiqueta «Sin
                    sincronizar» hasta que MockAPI lo confirme.
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </View>
      </PageScroll>
    </Screen>
  );
}

function Fact({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.fact, full && styles.factFull]}>
      <Text style={[styles.factLabel, { color: theme.inkMuted }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.factValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.four,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hero: {
    position: 'relative',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  spriteWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: Spacing.two,
  },
  heroInfoNarrow: {
    alignItems: 'center',
  },
  dexNumber: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  name: {
    fontFamily: Fonts.sans,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  genus: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  types: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginVertical: Spacing.one,
  },
  typesNarrow: {
    justifyContent: 'center',
  },
  descriptionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  flavor: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 29,
  },
  descriptionMeta: {
    gap: Spacing.one,
  },
  help: {
    fontSize: 12,
    lineHeight: 18,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  panel: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  stats: {
    gap: Spacing.two + 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statLabel: {
    width: 92,
    fontSize: 12,
    fontWeight: '700',
  },
  statTrack: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
    borderRadius: 5,
  },
  statValue: {
    width: 34,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '900',
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.three,
    rowGap: Spacing.three,
  },
  fact: {
    width: '46%',
    gap: 2,
  },
  factFull: {
    width: '100%',
    marginTop: Spacing.one,
  },
  factLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  factValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  collectionCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  collectionKicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  collectionTitle: {
    fontFamily: Fonts.sans,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
  },
});
