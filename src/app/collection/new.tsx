import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FeedbackState } from '@/components/ui/feedback';
import { PageScroll, Screen } from '@/components/ui/page';
import { PageHeader } from '@/components/ui/page-header';
import { CollectionForm, type CollectionFormValues } from '@/features/collection/components/collection-form';
import { PERSONAL_TYPES, REGIONS } from '@/constants/pokemon';
import { Spacing } from '@/constants/theme';
import { useCollection } from '@/hooks/use-collection';
import { useCreateCollection } from '@/hooks/use-collection-mutations';
import { useTheme } from '@/hooks/use-theme';
import { enqueueCollectionCreate } from '@/query/collection-outbox';
import { useNetworkStatus } from '@/query/network';
import { queryClient } from '@/query/query-client';
import type { CreateCollectionInput, PersonalType } from '@/types/collection';
import { ApiError, getErrorMessage } from '@/utils/errors';
import { logEvent } from '@/utils/logger';

type NewCollectionParams = {
  pokemonId?: string;
  name?: string;
  spriteUrl?: string;
  region?: string;
  personalType?: string;
};

function isPersonalType(value: string | undefined): value is PersonalType {
  return PERSONAL_TYPES.some((item) => item.value === value);
}

export default function NewCollectionScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<NewCollectionParams>();
  const { isOnline } = useNetworkStatus();
  const createMutation = useCreateCollection();
  const collectionQuery = useCollection();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const submissionInProgress = useRef(false);

  const pokemonId = Number(params.pokemonId);
  const name = params.name?.trim() ?? '';
  const spriteUrl = params.spriteUrl ?? '';
  const hasIdentity = Number.isFinite(pokemonId) && pokemonId > 0 && name.length > 0;

  const region = REGIONS.find((item) => item === params.region) ?? '';
  const personalType: PersonalType = isPersonalType(params.personalType)
    ? params.personalType
    : 'favorito';

  const duplicates =
    collectionQuery.data?.filter(
      (record) => record.pokemonId === pokemonId && !record.__optimistic,
    ) ?? [];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSubmit = async (values: CollectionFormValues) => {
    if (!hasIdentity || submissionInProgress.current) return;

    submissionInProgress.current = true;
    setIsSaving(true);
    setSubmitError(null);

    const input: CreateCollectionInput = {
      pokemonId,
      name,
      spriteUrl,
      region: values.region,
      captured: values.captured,
      priority: values.priority,
      personalType: values.personalType,
      createdAt: new Date().toISOString(),
    };
    const optimisticId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const variables = { optimisticId, input };

    if (!isOnline) {
      try {
        await enqueueCollectionCreate(queryClient, variables);
        logEvent('mutation:create:queued', {
          optimisticId,
          pokemonId,
          reason: 'offline',
        });
        router.replace('/collection');
      } catch (error) {
        setSubmitError(
          `${getErrorMessage(error)} El registro no se añadió porque no se pudo guardar de forma segura en este dispositivo.`,
        );
        submissionInProgress.current = false;
        setIsSaving(false);
      }
      return;
    }

    try {
      await createMutation.mutateAsync(variables);
      router.replace('/collection');
    } catch (error) {
      if (error instanceof ApiError && (error.status === undefined || error.status >= 500)) {
        try {
          await enqueueCollectionCreate(queryClient, variables);
          logEvent('mutation:create:queued', {
            optimisticId,
            pokemonId,
            reason: 'network-failure',
          });
          router.replace('/collection');
          return;
        } catch (queueError) {
          setSubmitError(
            `${getErrorMessage(error)} Además, no se pudo guardar una copia local: ${getErrorMessage(queueError)}`,
          );
          submissionInProgress.current = false;
          setIsSaving(false);
          return;
        }
      }

      setSubmitError(
        `${getErrorMessage(error)} El registro no se confirmó y no se ha guardado como confirmado.`,
      );
      submissionInProgress.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <PageScroll>
        <View style={styles.stack}>
          <PageHeader
            eyebrow="Nuevo registro"
            title="Añadir a mi colección"
            subtitle="Completa los campos personales. La identidad del Pokémon viene de PokéAPI y no se envía al formulario remoto como dato editable."
            onBack={handleBack}
          />

          {!hasIdentity ? (
            <FeedbackState
              tone="error"
              title="Faltan datos del Pokémon"
              message="Abre este formulario desde la ficha de un Pokémon para conservar su identificador, nombre e imagen."
              actionLabel="Volver a la Pokédex"
              onAction={() => router.replace('/')}
              symbol="!"
            />
          ) : (
            <>
              {duplicates.length > 0 ? (
                <View
                  style={[
                    styles.duplicateNotice,
                    { backgroundColor: theme.warningSoft, borderColor: theme.warning },
                  ]}>
                  <Text style={[styles.duplicateText, { color: theme.textSecondary }]}>
                    Ya tienes {duplicates.length} registro{duplicates.length === 1 ? '' : 's'} de
                    este Pokémon. Puedes crear otro, pero revisa antes tu colección para evitar
                    duplicados.
                  </Text>
                </View>
              ) : null}

              <CollectionForm
                identity={{ pokemonId, name, spriteUrl }}
                initialValues={{ region, personalType }}
                submitLabel="Guardar en mi colección"
                onSubmit={(values) => void handleSubmit(values)}
                submitting={isSaving || createMutation.isPending}
                isOnline={isOnline}
                submitError={submitError}
                notice={
                  isOnline
                    ? 'Al guardar se crea un registro en MockAPI. Si falla la conexión, se guardará en este dispositivo para reintentar.'
                    : 'El registro quedará guardado en este dispositivo y aparecerá como pendiente en «Mi colección» hasta sincronizarse.'
                }
              />
            </>
          )}
        </View>
      </PageScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: Spacing.four,
  },
  duplicateNotice: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
  },
  duplicateText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
