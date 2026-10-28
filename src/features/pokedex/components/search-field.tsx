import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading?: boolean;
  placeholder?: string;
};

export function SearchField({
  value,
  onChangeText,
  onSubmit,
  onClear,
  loading = false,
  placeholder = 'Nombre o número: pikachu, 25…',
}: Props) {
  const theme = useTheme();
  const hasValue = value.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow },
      ]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.inkMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Buscar Pokémon por nombre o número"
        style={[styles.input, { color: theme.text }]}
      />

      {hasValue ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          onPress={onClear}
          style={({ pressed }) => [styles.clear, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[styles.clearText, { color: theme.inkMuted }]}>×</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.accent, opacity: loading ? 0.6 : pressed ? 0.8 : 1 },
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.onAccent} />
        ) : (
          <Text style={[styles.buttonText, { color: theme.onAccent }]}>Buscar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.two,
    minHeight: 40,
  },
  clear: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '400',
  },
  button: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
