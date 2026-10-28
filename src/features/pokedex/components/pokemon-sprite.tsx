import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  uri?: string | null;
  size?: number;
  label?: string;
};

export function PokemonSprite({ uri, size = 72, label = 'Pokémon' }: Props) {
  const theme = useTheme();

  if (!uri) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            width: size,
            height: size,
            borderRadius: size / 2.6,
            backgroundColor: theme.surfaceMuted,
            borderColor: theme.border,
          },
        ]}>
        <View style={[styles.ball, { borderColor: theme.borderStrong }]}>
          <View style={[styles.ballBand, { backgroundColor: theme.borderStrong }]} />
          <View style={[styles.ballCenter, { borderColor: theme.borderStrong }]} />
        </View>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      contentFit="contain"
      transition={180}
      accessibilityLabel={label}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ball: {
    width: '52%',
    height: '52%',
    borderRadius: 999,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    top: '48%',
  },
  ballCenter: {
    width: '38%',
    height: '38%',
    borderRadius: 999,
    borderWidth: 2,
  },
});
