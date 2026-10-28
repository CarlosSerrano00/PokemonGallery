import { useIsRestoring } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { FeedbackState } from '@/components/ui/feedback';
import { PageScroll, Screen } from '@/components/ui/page';
import { PageHeader } from '@/components/ui/page-header';
import { CollectionForm, type CollectionFormValues } from '@/features/collection/components/collection-form';
import { PERSONAL_TYPES } from '@/constants/pokemon';
import { Spacing } from '@/constants/theme';
import { useCollection, useCollectionRecord } from '@/hooks/use-collection';
import { useUpdateCollection } from '@/hooks/use-collection-mutations';
import { useTheme } from '@/hooks/use-theme';
import { useNetworkStatus } from '@/query/network';
import type { PersonalType, UpdateCollectionInput } from '@/types/collection';
import { getErrorMessage } from '@/utils/errors';
import { logEvent } from '@/utils/logger';

export default function EditCollectionScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOnline } = useNetworkStatus();
  const isRestoring = useIsRestoring();
  const recordQuery = useCollectionRecord(id);
  const collectionQuery = useCollection();
  const updateMutation = useUpdateCollection();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // When the device is offline, the detail query stays paused. Falling back to
  // the already-cached list lets the user edit a confirmed record without a
  // second network round-trip.
  const listRecord = collectionQuery.data?.find((item) => item.id === id);
  const record = recordQuery.data ?? listRecord;
  const pausedWithoutData =
    !record &&
    !isRestoring &&
    (recordQuery.fetchStatus === 'paused' || collectionQuery.fetchStatus === 'paused');
  const waitingForRecord =
    !record &&
    !isRestoring &&
    !pausedWithoutData &&
    (recordQuery.isPending || collectionQuery.isPending);
  const personalType: PersonalType | undefined = record
    ? PERSONAL_TYPES.some((item) => item.value === record.personalType)
      ? (record.personalType as PersonalType)
      : 'pendiente'
    : undefined;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/collection');
    }
  };

  const handleSubmit = async (values: CollectionFormValues) => {
    if (!record) return;

    setSubmitError(null);

    const input: UpdateCollectionInput = {
      pokemonId: record.pokemonId,
      name: record.name,
      spriteUrl: record.spriteUrl,
      region: values.region,
      captured: values.captured,
      priority: values.priority,
      personalType: values.personalType,
      // Editing must preserve the original creation date.
      createdAt: record.createdAt,
    };
    const variables = { id: record.id, input };

    if (!isOnline) {
      logEvent('mutation:update:queued', {
        id: record.id,
        reason: 'offline',
      });
      updateMutation.mutate(variables);
      router.replace('/collection');
      return;
    }

    try {
      await updateMutation.mutateAsync(variables);
      router.replace('/collection');
    } catch (error) {
      setSubmitError(
        `${getErrorMessage(error)} El cambio no se confirmó. La colección se reconciliará con MockAPI.`,
      );
    }
  };

  return (
    <Screen>
      <PageScroll>
        <View style={styles.stack}>
          <PageHeader
            eyebrow="Editar registro"
            title="Campos personales"
            subtitle="La identidad del Pokémon se conserva. Solo cambian región, captura, prioridad y categoría."
            onBack={handleBack}
          />

          {pausedWithoutData ? (
            <FeedbackState
              title="Sin copia local de este registro"
              message="El dispositivo está sin conexión y este registro no está en la colección guardada. Vuelve cuando recuperes la red para editarlo."
              actionLabel="Ir a mi colección"
              onAction={() => router.replace('/collection')}
              symbol="⌁"
            />
          ) : null}

          {waitingForRecord || (isRestoring && !record) ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                {isRestoring ? 'Restaurando registro guardado…' : 'Cargando registro…'}
              </Text>
            </View>
          ) : null}

          {recordQuery.isError && !record ? (
            <FeedbackState
              tone="error"
              title="No se pudo abrir el registro"
              message={`${getErrorMessage(recordQuery.error)} Si el registro se creó sin conexión, espera a que se sincronice para editar sus campos personales.`}
              actionLabel="Reintentar"
              onAction={() => void recordQuery.refetch()}
              symbol="!"
            />
          ) : null}

          {record?.__optimistic ? (
            <FeedbackState
              title="Registro pendiente de sincronizar"
              message="MockAPI todavía no ha confirmado este registro, por lo que aún no tiene un identificador remoto estable. Espera a que termine la sincronización para editarlo."
              actionLabel="Ir a mi colección"
              onAction={() => router.replace('/collection')}
              symbol="⌛"
            />
          ) : null}

          {record && !record.__optimistic ? (
            <CollectionForm
              identity={{
                pokemonId: record.pokemonId,
                name: record.name,
                spriteUrl: record.spriteUrl,
              }}
              initialValues={{
                region: record.region,
                captured: record.captured,
                priority: record.priority,
                personalType,
                personalTypeRaw: record.personalType,
              }}
              createdAt={record.createdAt}
              submitLabel="Guardar cambios"
              onSubmit={(values) => void handleSubmit(values)}
              submitting={updateMutation.isPending}
              isOnline={isOnline}
              submitError={submitError}
              notice="Los cambios se aplican de forma optimista en la caché y se confirman con un PUT a MockAPI."
            />
          ) : null}
        </View>
      </PageScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.four,
  },
  loading: {
    flexDirection: 'row',
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
