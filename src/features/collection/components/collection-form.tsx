import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { Section } from '@/components/ui/section';
import { PokemonSprite } from '@/features/pokedex/components/pokemon-sprite';
import {
  PERSONAL_TYPES,
  REGIONS,
  formatDexNumber,
  formatPokemonName,
  getPersonalTypeStyle,
  humanizeSlug,
} from '@/constants/pokemon';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PersonalType } from '@/types/collection';

export type CollectionFormValues = {
  region: string;
  captured: boolean;
  priority: number;
  personalType: PersonalType;
};

type Props = {
  identity: {
    pokemonId: number;
    name: string;
    spriteUrl: string;
  };
  initialValues?: Partial<CollectionFormValues> & { personalTypeRaw?: string };
  createdAt?: string;
  submitLabel: string;
  onSubmit: (values: CollectionFormValues) => void;
  submitting?: boolean;
  isOnline: boolean;
  submitError?: string | null;
  notice?: string | null;
  disabled?: boolean;
};

const priorityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function clampPriority(value: number | undefined): number {
  if (!Number.isFinite(value)) return 5;
  return Math.min(10, Math.max(1, Math.round(value as number)));
}

export function CollectionForm({
  identity,
  initialValues,
  createdAt,
  submitLabel,
  onSubmit,
  submitting = false,
  isOnline,
  submitError,
  notice,
  disabled = false,
}: Props) {
  const theme = useTheme();
  const [region, setRegion] = useState(initialValues?.region ?? '');
  const [captured, setCaptured] = useState(initialValues?.captured ?? false);
  const [priority, setPriority] = useState(clampPriority(initialValues?.priority));
  const [personalType, setPersonalType] = useState<PersonalType>(
    (initialValues?.personalType as PersonalType | undefined) ?? 'favorito',
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const rawPersonalType = initialValues?.personalTypeRaw;
  const hasUnknownPersonalType =
    Boolean(rawPersonalType) &&
    !PERSONAL_TYPES.some((item) => item.value === rawPersonalType);

  const handleSubmit = () => {
    if (!region) {
      setValidationError('Selecciona una región para el registro.');
      return;
    }
    if (!identity.name || !identity.pokemonId) {
      setValidationError('Faltan datos del Pokémon. Vuelve a la ficha e inténtalo de nuevo.');
      return;
    }
    setValidationError(null);
    onSubmit({ region, captured, priority, personalType });
  };

  const error = validationError ?? submitError;

  return (
    <View style={styles.form}>
      <View
        style={[
          styles.identity,
          { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow },
        ]}>
        <PokemonSprite uri={identity.spriteUrl} size={82} label={formatPokemonName(identity.name)} />
        <View style={styles.identityInfo}>
          <Text style={[styles.dexNumber, { color: theme.accent }]}>
            {formatDexNumber(identity.pokemonId)}
          </Text>
          <Text style={[styles.name, { color: theme.text }]}>
            {formatPokemonName(identity.name)}
          </Text>
          <Text style={[styles.identityMeta, { color: theme.textSecondary }]}>
            Identidad de PokéAPI · campos personales editables
          </Text>
        </View>
      </View>

      {notice ? (
        <View style={[styles.notice, { backgroundColor: theme.infoSoft, borderColor: theme.info }]}>
          <Text style={[styles.noticeText, { color: theme.textSecondary }]}>{notice}</Text>
        </View>
      ) : null}

      <Section kicker="Organización personal" title="Región">
        <Text style={[styles.help, { color: theme.textSecondary }]}>
          Se propone la región de origen según la generación de la especie. Puedes cambiarla.
        </Text>
        <ChipRow>
          {REGIONS.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={region === item}
              onPress={() => setRegion(item)}
              disabled={disabled}
            />
          ))}
        </ChipRow>
      </Section>

      <Section kicker="Estado" title="Captura y prioridad">
        <View
          style={[
            styles.switchRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={styles.switchText}>
            <Text style={[styles.switchTitle, { color: theme.text }]}>Pokémon capturado</Text>
            <Text style={[styles.help, { color: theme.textSecondary }]}>
              Actívalo si ya forma parte de tu equipo.
            </Text>
          </View>
          <Switch
            value={captured}
            onValueChange={setCaptured}
            disabled={disabled}
            trackColor={{ false: theme.border, true: theme.success }}
            thumbColor={theme.surface}
            accessibilityLabel="Marcar como capturado"
          />
        </View>

        <View
          style={[
            styles.priorityCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <View style={styles.priorityHeader}>
            <View style={styles.switchText}>
              <Text style={[styles.switchTitle, { color: theme.text }]}>Prioridad</Text>
              <Text style={[styles.help, { color: theme.textSecondary }]}>
                De 1 a 10. La colección se puede ordenar por este valor.
              </Text>
            </View>
            <Text style={[styles.priorityValue, { color: theme.accent }]}>{priority}</Text>
          </View>

          <View style={styles.priorityControls}>
            <Button
              label="−"
              size="sm"
              variant="secondary"
              disabled={disabled || priority <= 1}
              onPress={() => setPriority((value) => Math.max(1, value - 1))}
            />
            <View style={styles.priorityTrack}>
              {priorityOptions.map((value) => (
                <View
                  key={value}
                  style={[
                    styles.prioritySegment,
                    {
                      backgroundColor: value <= priority ? theme.accent : theme.surfaceMuted,
                    },
                  ]}
                />
              ))}
            </View>
            <Button
              label="+"
              size="sm"
              variant="secondary"
              disabled={disabled || priority >= 10}
              onPress={() => setPriority((value) => Math.min(10, value + 1))}
            />
          </View>
        </View>
      </Section>

      <Section kicker="Clasificación" title="Categoría personal">
        {hasUnknownPersonalType ? (
          <Text style={[styles.help, { color: theme.warning }]}>
            El registro remoto usa la categoría «{humanizeSlug(rawPersonalType ?? '')}». Elige una
            de las categorías disponibles para actualizarla.
          </Text>
        ) : null}
        <ChipRow>
          {PERSONAL_TYPES.map((item) => {
            const style = getPersonalTypeStyle(item.value);
            return (
              <Chip
                key={item.value}
                label={item.label}
                selected={personalType === item.value}
                onPress={() => setPersonalType(item.value)}
                backgroundColor={style.background}
                textColor={style.text}
                disabled={disabled}
              />
            );
          })}
        </ChipRow>
      </Section>

      {createdAt ? (
        <Text style={[styles.help, { color: theme.inkMuted }]}>
          Fecha de creación conservada: {new Date(createdAt).toLocaleString()}
        </Text>
      ) : null}

      {!isOnline ? (
        <View style={[styles.notice, { backgroundColor: theme.warningSoft, borderColor: theme.warning }]}>
          <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
            Sin conexión: al guardar, los cambios quedarán pendientes y se enviarán al recuperar
            la conexión.
          </Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.error, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
        </View>
      ) : null}

      <Button
        label={submitLabel}
        onPress={handleSubmit}
        loading={submitting}
        disabled={disabled}
        fullWidth
      />

      <Text style={[styles.footnote, { color: theme.inkMuted }]}>
        La confirmación remota solo se muestra después de recibir la respuesta de MockAPI.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  identityInfo: {
    flex: 1,
    gap: 2,
  },
  dexNumber: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  name: {
    fontFamily: Fonts.serif,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
  },
  identityMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  notice: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
  },
  help: {
    fontSize: 12,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  priorityCard: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  priorityValue: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
  },
  priorityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  priorityTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  prioritySegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  error: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  footnote: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
